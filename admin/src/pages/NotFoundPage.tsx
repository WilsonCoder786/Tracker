import { Link } from 'react-router-dom';
import { EmptyState } from '../components/ui/EmptyState';

export function NotFoundPage() {
  return (
    <div className="login-page">
      <div className="login-card">
        <EmptyState
          title="Page not found"
          description="This admin route does not exist."
          action={
            <Link className="btn btn-primary" to="/">
              Back to dashboard
            </Link>
          }
        />
      </div>
    </div>
  );
}
