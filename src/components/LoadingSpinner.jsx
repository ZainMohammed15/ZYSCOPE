import './LoadingSpinner.css';

export default function LoadingSpinner({ isVisible }) {
  if (!isVisible) return null;

  return (
    <div className="loading-spinner">
      <div className="earth">
        <div className="continents"></div>
      </div>
    </div>
  );
}
