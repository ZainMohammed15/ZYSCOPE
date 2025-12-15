import React, { useEffect, useState } from 'react';
import { audio } from './utils/audioSystem';
import { useUser } from './userContext';

function ReviewCard({ item }) {
  return (
    <article className="card" style={{ padding: '14px 16px 12px', background: '#2a3039', borderColor: 'var(--border)' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <div style={{ display: 'grid', gap: 3 }}>
          <strong style={{ fontSize: 15 }}>{item.username || 'Anonymous'}</strong>
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            {[...Array(5)].map((_, i) => (
              <span key={i} style={{ color: i < item.rating ? 'var(--accent)' : 'var(--muted)', fontSize: 16 }}>
                {i < item.rating ? '★' : '☆'}
              </span>
            ))}
          </div>
        </div>
        <span style={{ color: 'var(--muted)', fontSize: 12 }}>{item.date || 'Just now'}</span>
      </header>
      <p style={{ margin: '0 0 10px', color: 'var(--text)', lineHeight: 1.5 }}>{item.comment}</p>
      {item.image && (
        <img 
          src={item.image} 
          alt="Review" 
          style={{ 
            width: '100%', 
            maxHeight: 200, 
            objectFit: 'cover', 
            borderRadius: 8, 
            marginTop: 8 
          }} 
        />
      )}
    </article>
  );
}

export default function Reviews() {
  const { user } = useUser();
  const [form, setForm] = useState({ rating: 5, comment: '', image: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  
  const emojis = ['😊', '😍', '🤩', '👍', '❤️', '🔥', '✨', '🎉', '🌟', '💯', '🚀', '🎯', '💪', '🙌', '👏', '🌈', '🌍', '✈️', '🗺️', '📍', '🏆', '⭐', '💡', '🎨', '🎮'];
  
  // Mock reviews about the website
  const [feed, setFeed] = useState([
    {
      id: 1,
      username: 'TravelEnthusiast',
      rating: 5,
      comment: 'ZYSCOPE has completely changed how I plan my travels! The interactive map is intuitive, the country comparisons are incredibly helpful, and tracking my visits keeps me motivated. Love the clean design and smooth experience!',
      date: '2 days ago',
      image: null
    },
    {
      id: 2,
      username: 'DigitalNomad',
      rating: 5,
      comment: 'Best travel planning tool I\'ve found. The XP system makes exploring feel like a game, and the detailed country stats help me make informed decisions. The tooltips are super helpful for understanding each metric!',
      date: '5 days ago',
      image: null
    },
    {
      id: 3,
      username: 'WorldExplorer',
      rating: 4,
      comment: 'Really impressive app! The country comparison feature is genius and the dashboard gives great insights into my travel journey. Would love to see more social features in the future, but overall fantastic work!',
      date: '1 week ago',
      image: null
    },
    {
      id: 4,
      username: 'AdventureSeeker',
      rating: 5,
      comment: 'Amazing country! The website makes it so easy to discover new destinations and keep track of where I\'ve been. The sound effects and animations add a nice touch. Can\'t wait to see what features come next!',
      date: '2 weeks ago',
      image: null
    }
  ]);

  useEffect(() => {
    audio.playPageLoad();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.comment.trim()) {
      setSubmitError('Please write a comment');
      return;
    }

    setSubmitting(true);
    setSubmitError('');

    try {
      audio.playClick();
      
      // Add new review to the feed
      const newReview = {
        id: Date.now(),
        username: user?.username || 'Anonymous',
        rating: parseInt(form.rating),
        comment: form.comment,
        date: 'Just now',
        image: form.image || null
      };

      setFeed([newReview, ...feed]);
      setForm({ rating: 5, comment: '', image: '' });
      audio.success();

      setTimeout(() => {
        const event = new CustomEvent('assistant:show', { 
          detail: { message: '🎉 Thanks for your feedback! Your review helps make ZYSCOPE better!' }
        });
        window.dispatchEvent(event);
      }, 300);

    } catch (err) {
      setSubmitError('Unable to submit review');
      audio.error();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="app-shell">
      <main>
        <section style={{ marginBottom: 14 }}>
          <h1 style={{ margin: '0 0 6px', cursor: 'default' }} onMouseEnter={() => audio.playHover()}>
            ⭐ Community Reviews
          </h1>
          <p style={{ margin: 0, color: 'var(--muted)' }}>💬 Share your thoughts and see what others are saying about ZYSCOPE!</p>
        </section>

        {/* Submit Review Form */}
        <section className="card" style={{ marginBottom: 14 }}>
          <h3 style={{ margin: '0 0 12px', fontSize: 17 }}>Share Your Experience</h3>
          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 12 }}>
            <label style={{ display: 'grid', gap: 6 }}>
              <span style={{ color: 'var(--muted)', fontSize: 13 }}>⭐ Rating</span>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, rating: star }))}
                    onMouseEnter={() => audio.playHover()}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      fontSize: 28,
                      cursor: 'pointer',
                      color: star <= form.rating ? 'var(--accent)' : 'var(--muted)',
                      transition: 'color 150ms ease, transform 150ms ease',
                      padding: 0
                    }}
                    onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                    onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  >
                    {star <= form.rating ? '★' : '☆'}
                  </button>
                ))}
              </div>
            </label>

            <label style={{ display: 'grid', gap: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--muted)', fontSize: 13 }}>💬 Your Review</span>
                <button
                  type="button"
                  onClick={() => { setShowEmojiPicker(!showEmojiPicker); audio.playClick(); }}
                  onMouseEnter={() => audio.playHover()}
                  style={{
                    background: 'var(--panel)',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    padding: '4px 10px',
                    cursor: 'pointer',
                    fontSize: 16,
                    transition: 'transform 150ms ease'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                  onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                  😊 Add Emoji
                </button>
              </div>
              
              {showEmojiPicker && (
                <div style={{
                  padding: '12px',
                  background: 'var(--panel)',
                  border: '1px solid var(--border)',
                  borderRadius: 10,
                  display: 'grid',
                  gridTemplateColumns: 'repeat(8, 1fr)',
                  gap: 6
                }}>
                  {emojis.map((emoji, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setForm(f => ({ ...f, comment: f.comment + emoji }));
                        audio.playClick();
                      }}
                      onMouseEnter={() => audio.playHover()}
                      style={{
                        background: 'transparent',
                        border: '1px solid var(--border)',
                        borderRadius: 6,
                        padding: '8px',
                        cursor: 'pointer',
                        fontSize: 20,
                        transition: 'transform 150ms ease, background 150ms ease'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.transform = 'scale(1.2)';
                        e.currentTarget.style.background = 'rgba(255, 222, 47, 0.1)';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                        e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
              
              <textarea
                value={form.comment}
                onChange={(e) => setForm(f => ({ ...f, comment: e.target.value }))}
                placeholder="What do you think about ZYSCOPE? Share your experience, favorite features, or suggestions..."
                rows={4}
                style={{
                  padding: '10px 12px',
                  borderRadius: 10,
                  border: '1px solid var(--border)',
                  background: '#1f232a',
                  color: 'var(--text)',
                  resize: 'vertical',
                  fontSize: 14,
                  lineHeight: 1.5
                }}
                required
              />
            </label>

            <label style={{ display: 'grid', gap: 6 }}>
              <span style={{ color: 'var(--muted)', fontSize: 13 }}>🖼️ Image URL (optional)</span>
              <input
                type="url"
                value={form.image}
                onChange={(e) => setForm(f => ({ ...f, image: e.target.value }))}
                placeholder="https://example.com/image.jpg"
                style={{
                  padding: '10px 12px',
                  borderRadius: 10,
                  border: '1px solid var(--border)',
                  background: '#1f232a',
                  color: 'var(--text)',
                  fontSize: 14
                }}
              />
            </label>

            {submitError && <div style={{ color: '#ffb3b3', fontSize: 13 }}>{submitError}</div>}

            <button
              type="submit"
              disabled={submitting}
              onMouseEnter={() => audio.playHover()}
              style={{
                padding: '12px 16px',
                borderRadius: 12,
                border: '1px solid var(--accent)',
                background: 'var(--accent)',
                color: '#0c1317',
                fontWeight: 700,
                cursor: submitting ? 'wait' : 'pointer',
                fontSize: 15,
                opacity: submitting ? 0.7 : 1,
                transition: 'opacity 200ms ease, transform 200ms ease'
              }}
              onMouseOver={(e) => !submitting && (e.currentTarget.style.transform = 'translateY(-1px)')}
              onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              {submitting ? '✨ Submitting...' : '🚀 Submit Review'}
            </button>
          </form>
        </section>

        {/* Reviews Feed */}
        <section className="card">
          <h3 style={{ margin: '0 0 12px', fontSize: 17 }}>Recent Feedback</h3>
          <div style={{ display: 'grid', gap: 12 }}>
            {feed.length === 0 && <div style={{ color: 'var(--muted)', padding: '20px 0', textAlign: 'center' }}>No reviews yet. Be the first to share your thoughts!</div>}
            {feed.map((item) => (
              <ReviewCard key={item.id} item={item} />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
