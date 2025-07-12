import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { auth, db } from './firebase';

// Import all components
import ModernKnowledgeBase from './components/ModernKnowledgeBase';
import AdminProvisioning from './components/AdminProvisioning';
import CoachWelcome from './components/CoachWelcome';
import { 
  UserIcon, ICON_COLORS 
} from './components/Icons';

// Brand Logo Components
const IvylevelFullLogo = ({ style = {} }) => (
  <svg style={{width: '92px', height: '27px', ...style}} viewBox="0 0 92 27" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M9.34866 11.2647V15.0609C9.75237 11.7555 12.5671 9.19429 15.9792 9.19429V16.771C15.9792 20.4644 12.9866 23.457 9.29325 23.457V21.2997C4.42835 21.2681 0.493347 17.3173 0.493347 12.4482V2.4093C5.382 2.4093 9.34866 6.37184 9.34866 11.2647Z" fill="#FE4A22"/>
    <path d="M8.34308 3.04325C9.37714 2.4749 10.2275 1.62228 10.7924 0.586304C11.3598 1.62053 12.2135 2.47106 13.2492 3.03571C12.2143 3.60315 11.364 4.45602 10.7999 5.49266C10.232 4.45868 9.3788 3.60753 8.34308 3.04325Z" fill="#FE4A22"/>
    <path d="M51.1788 5.17236H52.6249V21.5033H51.1788V5.17236Z" fill="#641432"/>
    <path d="M24.5442 6.5116H24.4901C24.0476 6.5116 23.6889 6.86935 23.6889 7.31064C23.6889 7.75197 24.0476 8.10972 24.4901 8.10972H24.5442C24.9867 8.10972 25.3454 7.75197 25.3454 7.31064C25.3454 6.86935 24.9867 6.5116 24.5442 6.5116Z" fill="#641432"/>
    <path d="M23.8066 10.2825V21.5041H25.2532V10.2825H23.8066Z" fill="#641432"/>
    <path d="M32.6366 18.448C32.7066 18.277 32.7729 18.0981 32.835 17.9115L35.6113 10.2825H37.1512L32.765 21.5041H31.2018L26.8627 10.2825H28.4725L31.2485 17.9115C31.311 18.067 31.373 18.2264 31.4351 18.3897C31.4976 18.553 31.5597 18.7047 31.6218 18.8446C31.6842 19.0468 31.7501 19.2413 31.8201 19.4279C31.8901 19.6146 31.9563 19.7935 32.0184 19.9647C32.0809 19.8089 32.1467 19.6496 32.2167 19.4862C32.2867 19.3229 32.3529 19.1479 32.415 18.9613C32.4929 18.7902 32.5666 18.6191 32.6366 18.448Z" fill="#641432"/>
    <path d="M44.4157 17.6548C44.3537 17.8103 44.2874 17.9814 44.2174 18.1681C44.1474 18.3547 44.0658 18.5413 43.9724 18.728L43.8325 19.1013C43.7858 19.2257 43.7471 19.3501 43.7158 19.4746C43.3892 18.728 43.1405 18.1292 42.9692 17.6781L40.0062 10.2825H38.3968L42.9459 21.2008L40.8461 26.4269H42.386L48.7319 10.2825H47.1921L44.4157 17.6548Z" fill="#641432"/>
    <path fill-rule="evenodd" clip-rule="evenodd" d="M63.1106 10.6771C62.364 10.1949 61.462 9.95386 60.4046 9.95386C59.4247 9.95386 58.5382 10.2066 57.7449 10.7121C56.9517 11.2176 56.3255 11.9174 55.8668 12.8118C55.4081 13.7061 55.1785 14.7132 55.1785 15.833C55.1785 17.0929 55.4002 18.1738 55.8434 19.0759C56.2867 19.9781 56.9088 20.6622 57.7099 21.1288C58.5107 21.5954 59.4401 21.8287 60.498 21.8287C61.4466 21.8287 62.2669 21.6654 62.959 21.3388C63.6514 21.0122 64.1917 20.5689 64.5804 20.0093C64.9696 19.4492 65.2183 18.8115 65.327 18.0961H63.8805C63.7405 18.936 63.3714 19.5698 62.7723 19.9977C62.1736 20.4251 61.4233 20.6389 60.5213 20.6389C59.7589 20.6389 59.0864 20.4639 58.5032 20.1143C57.9199 19.7644 57.4649 19.247 57.1383 18.5627C56.8117 17.8783 56.6405 17.0618 56.625 16.113H65.397V15.7864C65.397 14.6199 65.2029 13.5972 64.8138 12.7185C64.425 11.8397 63.8572 11.1592 63.1106 10.6771ZM56.695 14.9932C56.7884 13.8733 57.1696 12.9517 57.8382 12.2285C58.5069 11.5053 59.3622 11.1437 60.4046 11.1437C61.4466 11.1437 62.3173 11.4936 62.9239 12.1935C63.5306 12.8934 63.8418 13.8267 63.8572 14.9932H56.695Z" fill="#641432"/>
    <path d="M72.0414 18.448C72.1114 18.277 72.1777 18.0981 72.2397 17.9115L75.0161 10.2825H76.556L72.1697 21.5041H70.6066L66.2675 10.2825H67.8773L70.6532 17.9115C70.7157 18.067 70.7778 18.2264 70.8399 18.3897C70.9024 18.553 70.9645 18.7047 71.0265 18.8446C71.089 19.0468 71.1549 19.2413 71.2249 19.4279C71.2948 19.6146 71.3611 19.7935 71.4232 19.9647C71.4857 19.8089 71.5515 19.6496 71.6215 19.4862C71.6915 19.3229 71.7577 19.1479 71.8198 18.9613C71.8977 18.7902 71.9714 18.6191 72.0414 18.448Z" fill="#641432"/>
    <path fill-rule="evenodd" clip-rule="evenodd" d="M85.2609 10.6771C84.5143 10.1949 83.6123 9.95386 82.5545 9.95386C81.5746 9.95386 80.688 10.2066 79.8948 10.7121C79.1015 11.2176 78.4758 11.9174 78.0166 12.8118C77.5579 13.7061 77.3284 14.7132 77.3284 15.833C77.3284 17.0929 77.55 18.1738 77.9933 19.0759C78.4366 19.9781 79.059 20.6622 79.8598 21.1288C80.6609 21.5954 81.59 21.8287 82.6478 21.8287C83.5965 21.8287 84.4168 21.6654 85.1092 21.3388C85.8012 21.0122 86.3416 20.5689 86.7307 20.0093C87.1194 19.4492 87.3681 18.8115 87.4773 18.0961H86.0308C85.8908 18.936 85.5213 19.5698 84.9226 19.9977C84.3235 20.4251 83.5731 20.6389 82.6711 20.6389C81.9091 20.6389 81.2363 20.4639 80.653 20.1143C80.0698 19.7644 79.6148 19.247 79.2882 18.5627C78.9615 17.8783 78.7907 17.0618 78.7749 16.113H87.5473V15.7864C87.5473 14.6199 87.3527 13.5972 86.964 12.7185C86.5749 11.8397 86.0075 11.1592 85.2609 10.6771ZM78.8449 14.9932C78.9382 13.8733 79.3194 12.9517 79.9881 12.2285C80.6568 11.5053 81.5125 11.1437 82.5545 11.1437C83.5965 11.1437 84.4676 11.4936 85.0742 12.1935C85.6808 12.8934 85.9916 13.8267 86.0075 14.9932H78.8449Z" fill="#641432"/>
    <path d="M90.0909 5.17236H91.5374V21.5033H90.0909V5.17236Z" fill="#641432"/>
  </svg>
);

function App() {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('login');
  const [showAdminProvisioning, setShowAdminProvisioning] = useState(false);
  const [loginError, setLoginError] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        // Load user data from Firestore
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userDoc.exists()) {
          setUserData({ id: firebaseUser.uid, ...userDoc.data() });
          
          // Check if coach needs welcome experience
          const userData = userDoc.data();
          if (userData.role === 'coach' && userData.status === 'provisioned' && !userData.onboardingStarted) {
            setView('coach-welcome');
          } else {
            setView('home');
          }
        } else {
          // Create user document if it doesn't exist
          const newUserData = {
            email: firebaseUser.email,
            name: firebaseUser.displayName || firebaseUser.email.split('@')[0],
            role: firebaseUser.email.includes('admin') ? 'admin' : 'coach',
            createdAt: new Date().toISOString()
          };
          await setDoc(doc(db, 'users', firebaseUser.uid), newUserData);
          setUserData({ id: firebaseUser.uid, ...newUserData });
          setView('home');
        }
      } else {
        setUser(null);
        setUserData(null);
        setView('login');
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const handleLogin = async (email, password) => {
    try {
      setLoginError('');
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      setLoginError(error.message);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setView('login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: '#f8f9fa'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '48px',
            height: '48px',
            border: '3px solid rgba(255, 74, 35, 0.1)',
            borderTopColor: ICON_COLORS.primary,
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }} />
          <p>Loading...</p>
        </div>
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // Login View
  if (view === 'login') {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #FFE5DF 0%, #FFF9F7 100%)'
      }}>
        <div style={{
          background: 'white',
          padding: '48px',
          borderRadius: '16px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
          width: '100%',
          maxWidth: '400px'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <IvylevelFullLogo style={{ margin: '0 auto 24px' }} />
            <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#641432' }}>
              Welcome Back
            </h2>
          </div>
          
          <form onSubmit={(e) => {
            e.preventDefault();
            const email = e.target.email.value;
            const password = e.target.password.value;
            handleLogin(email, password);
          }}>
            <input
              type="email"
              name="email"
              placeholder="Email"
              required
              style={{
                width: '100%',
                padding: '12px',
                marginBottom: '16px',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '1rem'
              }}
            />
            
            <input
              type="password"
              name="password"
              placeholder="Password"
              required
              style={{
                width: '100%',
                padding: '12px',
                marginBottom: '24px',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '1rem'
              }}
            />
            
            {loginError && (
              <div style={{
                color: '#ef4444',
                fontSize: '0.875rem',
                marginBottom: '16px',
                textAlign: 'center'
              }}>
                {loginError}
              </div>
            )}
            
            <button
              type="submit"
              style={{
                width: '100%',
                padding: '12px',
                background: ICON_COLORS.primary,
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Sign In
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Coach Welcome View
  if (view === 'coach-welcome') {
    return (
      <CoachWelcome 
        coachId={userData?.id}
        onComplete={() => setView('home')}
      />
    );
  }

  // Home Dashboard
  if (view === 'home') {
    return (
      <div style={{minHeight: '100vh', background: '#f9fafb'}}>
        {/* Header */}
        <div style={{background: 'white', borderBottom: '1px solid #e5e7eb', padding: '16px 24px'}}>
          <div style={{maxWidth: '1200px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
            <IvylevelFullLogo />
            <div style={{display: 'flex', alignItems: 'center', gap: '24px'}}>
              <div style={{textAlign: 'right'}}>
                <div style={{fontSize: '0.875rem', color: '#6b7280'}}>Welcome back</div>
                <div style={{fontWeight: '600', color: '#641432'}}>{userData?.name}</div>
              </div>
              <button
                onClick={handleLogout}
                style={{
                  padding: '8px 16px',
                  background: '#FFE5DF',
                  color: '#641432',
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div style={{maxWidth: '1200px', margin: '0 auto', padding: '32px 24px'}}>
          <h1 style={{fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '32px', textAlign: 'center', color: '#641432'}}>
            IvyLevel Coach Portal
          </h1>

          {/* Admin Controls */}
          {userData?.role === 'admin' && (
            <div style={{ marginBottom: '32px', textAlign: 'center' }}>
              <button
                onClick={() => setShowAdminProvisioning(true)}
                style={{
                  padding: '12px 24px',
                  background: '#641432',
                  color: 'white',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: '600',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <UserIcon size={20} color="white" />
                Add New Coach
              </button>
            </div>
          )}

          {/* Video Library Button */}
          <div style={{ textAlign: 'center' }}>
            <button
              onClick={() => setView('videos')}
              style={{
                padding: '16px 32px',
                background: 'linear-gradient(135deg, #FF4A23, #FF6B47)',
                color: 'white',
                borderRadius: '12px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '1.125rem',
                fontWeight: '600',
                boxShadow: '0 10px 20px rgba(255, 74, 35, 0.2)'
              }}
            >
              Access Video Library
            </button>
          </div>
        </div>

        {/* Admin Provisioning Modal */}
        {showAdminProvisioning && <AdminProvisioning onClose={() => setShowAdminProvisioning(false)} />}
      </div>
    );
  }

  // Video Library View
  if (view === 'videos') {
    return (
      <div style={{minHeight: '100vh', background: '#f9fafb'}}>
        {/* Header */}
        <div style={{background: 'white', borderBottom: '1px solid #e5e7eb', padding: '16px 24px'}}>
          <div style={{maxWidth: '1200px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
            <IvylevelFullLogo />
            <button
              onClick={() => setView('home')}
              style={{
                padding: '8px 16px',
                background: '#FFE5DF',
                color: '#641432',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: '500'
              }}
            >
              Back to Dashboard
            </button>
          </div>
        </div>
        <ModernKnowledgeBase />
      </div>
    );
  }

  return null;
}

export default App;