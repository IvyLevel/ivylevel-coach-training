import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../App';
import { collection, getDocs, query, limit, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { 
  PlayIcon, ClockIcon, CalendarIcon, UserIcon, 
  SearchIcon, FilterIcon, CloseIcon, ICON_COLORS 
} from './Icons';

const ModernKnowledgeBase = () => {
  const authContext = useContext(AuthContext);
  const currentUser = authContext.userData || authContext.user;
  const [videos, setVideos] = useState([]);
  const [filteredVideos, setFilteredVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedCoach, setSelectedCoach] = useState('all');
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [hoveredVideo, setHoveredVideo] = useState(null);

  useEffect(() => {
    loadVideos();
  }, []);

  useEffect(() => {
    filterVideos();
  }, [videos, searchTerm, selectedCategory, selectedCoach]);

  const loadVideos = async () => {
    try {
      console.log('Loading videos for Modern Knowledge Base...');
      const videosRef = collection(db, 'indexed_videos');
      const q = query(videosRef, orderBy('uploadDate', 'desc'), limit(500));
      const snapshot = await getDocs(q);
      
      const videoData = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        const filename = data.filename || '';
        const folderPath = data.folderPath || '';
        
        // Skip Quick Check-ins and Miscellaneous
        if (filename.includes('TRIVIAL_') || data.category === 'Quick Check-in' ||
            folderPath.includes('/Miscellaneous/') || filename.includes('MISC_') || 
            data.category === 'Miscellaneous') {
          return;
        }
        
        // Only include proper coaching sessions
        const isCoachingSession = 
          filename.startsWith('Coaching_') || 
          filename.startsWith('GamePlan_') ||
          data.category === 'student_sessions' ||
          data.category === 'game_plan_reports';
          
        if (!isCoachingSession) {
          return;
        }
        
        // Extract coach and student names
        let coachName = data.parsedCoach || data.coach;
        let studentName = data.parsedStudent || data.student;
        
        // Parse from filename if needed
        if (filename && (filename.startsWith('Coaching_') || filename.startsWith('GamePlan_'))) {
          const parts = filename.split('_');
          if (parts.length >= 4) {
            const filenameCoach = parts[2];
            const filenameStudent = parts[3];
            
            if (!coachName || coachName === 'Unknown' || coachName === 'unknown') {
              if (filenameCoach && filenameCoach !== 'unknown') {
                coachName = filenameCoach;
              }
            }
            
            if (!studentName || studentName === 'Unknown' || studentName === 'unknown') {
              if (filenameStudent && filenameStudent !== 'unknown') {
                studentName = filenameStudent;
              }
            }
          }
        }
        
        // Try folder path as fallback
        if ((coachName === 'Unknown' || !coachName) || (studentName === 'Unknown' || !studentName)) {
          const folderParts = folderPath.split('/');
          if (folderParts.length >= 4) {
            const folderFilename = folderParts[folderParts.length - 1];
            if (folderFilename && (folderFilename.startsWith('Coaching_') || folderFilename.startsWith('GamePlan_'))) {
              const folderFilenameParts = folderFilename.split('_');
              if (folderFilenameParts.length >= 4) {
                const folderCoach = folderFilenameParts[2];
                const folderStudent = folderFilenameParts[3];
                
                if (!coachName || coachName === 'Unknown') {
                  if (folderCoach && folderCoach !== 'unknown') {
                    coachName = folderCoach;
                  }
                }
                
                if (!studentName || studentName === 'Unknown') {
                  if (folderStudent && folderStudent !== 'unknown') {
                    studentName = folderStudent;
                  }
                }
              }
            }
          }
        }
        
        // Generate clean title
        const weekMatch = (data.title || '').match(/Week\s+(\d+)/i);
        const isGamePlan = filename.includes('GamePlan');
        const weekPart = weekMatch ? `Week ${weekMatch[1]}` : '';
        const cleanTitle = isGamePlan 
          ? `${coachName} & ${studentName} - Game Plan`
          : `${coachName} & ${studentName}${weekPart ? ` - ${weekPart}` : ''}`;
        
        videoData.push({
          id: doc.id,
          title: cleanTitle,
          coach: coachName || 'Unknown',
          student: studentName || 'Unknown',
          category: data.category || 'General',
          duration: data.duration || '30:00',
          date: data.sessionDate || data.uploadDate,
          week: data.parsedWeek || (weekMatch ? parseInt(weekMatch[1]) : null),
          driveId: data.driveId,
          sessionType: isGamePlan ? 'game_plan' : 'coaching_session',
          thumbnail: `https://drive.google.com/thumbnail?id=${data.driveId}&sz=w400`,
          filename: filename
        });
      });
      
      console.log(`Loaded ${videoData.length} coaching videos`);
      setVideos(videoData);
      setFilteredVideos(videoData);
    } catch (err) {
      console.error('Error loading videos:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filterVideos = () => {
    let filtered = [...videos];
    
    if (searchTerm) {
      filtered = filtered.filter(video => 
        video.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        video.coach.toLowerCase().includes(searchTerm.toLowerCase()) ||
        video.student.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(video => video.category === selectedCategory);
    }
    
    if (selectedCoach !== 'all') {
      filtered = filtered.filter(video => video.coach === selectedCoach);
    }
    
    setFilteredVideos(filtered);
  };

  const getCoaches = () => {
    const coaches = new Set(videos.map(v => v.coach).filter(c => c !== 'Unknown'));
    return ['all', ...Array.from(coaches).sort()];
  };

  const getCategories = () => {
    const categories = new Set(videos.map(v => v.category));
    return ['all', ...Array.from(categories)];
  };

  const formatDuration = (duration) => {
    if (!duration || duration === '30:00') return '30m';
    const parts = duration.split(':');
    if (parts.length >= 2) {
      const hours = parseInt(parts[0]);
      const minutes = parseInt(parts[1]);
      if (hours > 0) return `${hours}h ${minutes}m`;
      return `${minutes}m`;
    }
    return duration;
  };

  const formatDate = (date) => {
    if (!date) return '';
    if (typeof date === 'object' && date._seconds) {
      return new Date(date._seconds * 1000).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
      });
    }
    return new Date(date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const VideoPlayer = ({ video, onClose }) => {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.95)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}>
        <div style={{
          position: 'relative',
          width: '100%',
          maxWidth: '1200px',
          height: '90vh',
          background: '#000',
          borderRadius: '12px',
          overflow: 'hidden'
        }}>
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              zIndex: 10,
              backdropFilter: 'blur(10px)'
            }}
          >
            <CloseIcon size={24} color="#fff" />
          </button>
          
          <iframe
            src={`https://drive.google.com/file/d/${video.driveId}/preview`}
            style={{
              width: '100%',
              height: '100%',
              border: 'none'
            }}
            allow="autoplay"
            allowFullScreen
          />
          
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            background: 'linear-gradient(to top, rgba(0,0,0,0.9), transparent)',
            padding: '40px 40px 20px',
            color: 'white'
          }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '8px' }}>{video.title}</h2>
            <div style={{ display: 'flex', gap: '20px', fontSize: '0.875rem', opacity: 0.8 }}>
              <span>{video.coach} • {video.student}</span>
              <span>{formatDuration(video.duration)}</span>
              <span>{formatDate(video.date)}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh',
        background: '#000',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '48px',
            height: '48px',
            border: '3px solid rgba(255, 255, 255, 0.1)',
            borderTopColor: '#FF4A23',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }} />
          <p style={{ opacity: 0.6 }}>Loading your content...</p>
          <style>{`
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: '100vh', background: '#000', color: 'white', padding: '40px', textAlign: 'center' }}>
        <h2>Error Loading Content</h2>
        <p style={{ color: '#ff4444' }}>{error}</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#000', color: 'white' }}>
      {/* Header */}
      <div style={{ 
        position: 'sticky',
        top: 0,
        background: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        zIndex: 100,
        padding: '20px 40px'
      }}>
        <div style={{ maxWidth: '1800px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <h1 style={{ fontSize: '2rem', fontWeight: '600', margin: 0 }}>
              Coaching Sessions
            </h1>
            <div style={{ fontSize: '0.875rem', opacity: 0.6 }}>
              {filteredVideos.length} videos
            </div>
          </div>
          
          {/* Search and Filters */}
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
              <SearchIcon 
                size={20} 
                color="rgba(255, 255, 255, 0.5)" 
                style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }}
              />
              <input
                type="text"
                placeholder="Search sessions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px 12px 48px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '0.875rem',
                  outline: 'none'
                }}
              />
            </div>
            
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              style={{
                padding: '12px 20px',
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '8px',
                color: 'white',
                fontSize: '0.875rem',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              {getCategories().map(cat => (
                <option key={cat} value={cat} style={{ background: '#000' }}>
                  {cat === 'all' ? 'All Types' : cat.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </option>
              ))}
            </select>
            
            <select
              value={selectedCoach}
              onChange={(e) => setSelectedCoach(e.target.value)}
              style={{
                padding: '12px 20px',
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '8px',
                color: 'white',
                fontSize: '0.875rem',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              {getCoaches().map(coach => (
                <option key={coach} value={coach} style={{ background: '#000' }}>
                  {coach === 'all' ? 'All Coaches' : coach}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Video Grid */}
      <div style={{ 
        maxWidth: '1800px', 
        margin: '0 auto', 
        padding: '40px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: '20px'
      }}>
        {filteredVideos.map(video => (
          <div
            key={video.id}
            style={{
              position: 'relative',
              borderRadius: '8px',
              overflow: 'hidden',
              cursor: 'pointer',
              transform: hoveredVideo === video.id ? 'scale(1.05)' : 'scale(1)',
              transition: 'transform 0.3s ease',
              background: 'rgba(255, 255, 255, 0.05)'
            }}
            onMouseEnter={() => setHoveredVideo(video.id)}
            onMouseLeave={() => setHoveredVideo(null)}
            onClick={() => setSelectedVideo(video)}
          >
            {/* Thumbnail with play overlay */}
            <div style={{
              position: 'relative',
              paddingTop: '56.25%', // 16:9 aspect ratio
              background: `linear-gradient(45deg, #1a1a1a, #2a2a2a)`,
              overflow: 'hidden'
            }}>
              {/* Placeholder gradient */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: `linear-gradient(135deg, 
                  ${video.sessionType === 'game_plan' ? '#641432' : '#FF4A23'}22, 
                  transparent)`
              }} />
              
              {/* Play button overlay */}
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                background: hoveredVideo === video.id ? 'rgba(255, 74, 35, 0.9)' : 'rgba(0, 0, 0, 0.7)',
                borderRadius: '50%',
                width: '60px',
                height: '60px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.3s ease'
              }}>
                <PlayIcon size={24} color="#fff" />
              </div>
              
              {/* Duration badge */}
              <div style={{
                position: 'absolute',
                bottom: '8px',
                right: '8px',
                background: 'rgba(0, 0, 0, 0.8)',
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '0.75rem',
                fontWeight: '500'
              }}>
                {formatDuration(video.duration)}
              </div>
              
              {/* Session type badge */}
              {video.sessionType === 'game_plan' && (
                <div style={{
                  position: 'absolute',
                  top: '8px',
                  left: '8px',
                  background: 'rgba(100, 20, 50, 0.9)',
                  padding: '4px 12px',
                  borderRadius: '4px',
                  fontSize: '0.7rem',
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Game Plan
                </div>
              )}
            </div>
            
            {/* Video info */}
            <div style={{ padding: '16px' }}>
              <h3 style={{ 
                fontSize: '0.9rem', 
                fontWeight: '500',
                marginBottom: '8px',
                lineHeight: '1.4',
                color: 'rgba(255, 255, 255, 0.9)'
              }}>
                {video.title}
              </h3>
              <div style={{ 
                fontSize: '0.75rem', 
                color: 'rgba(255, 255, 255, 0.5)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span>{video.coach} • {video.student}</span>
                <span>•</span>
                <span>{formatDate(video.date)}</span>
              </div>
              {video.week && (
                <div style={{
                  marginTop: '8px',
                  display: 'inline-block',
                  padding: '2px 8px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '4px',
                  fontSize: '0.7rem',
                  color: 'rgba(255, 255, 255, 0.7)'
                }}>
                  Week {video.week}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredVideos.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '80px 40px',
          color: 'rgba(255, 255, 255, 0.5)'
        }}>
          <h3 style={{ fontSize: '1.5rem', marginBottom: '8px' }}>No videos found</h3>
          <p>Try adjusting your search or filters</p>
        </div>
      )}

      {/* Video Player Modal */}
      {selectedVideo && (
        <VideoPlayer video={selectedVideo} onClose={() => setSelectedVideo(null)} />
      )}
    </div>
  );
};

export default ModernKnowledgeBase;