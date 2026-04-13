import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Redirect legacy /community-radar route to /dashboard/radar
export default function CommunityRadarPage() {
  const navigate = useNavigate();
  useEffect(() => {
    navigate('/dashboard/radar', { replace: true });
  }, [navigate]);
  return null;
}
