import { useState, useEffect } from 'react';
import VideoCard from '@/components/VideoCard';
import styles from './index.module.scss';

const API_KEY = 'AIzaSyDlfkraqNdGhYVVp1VIEhMmfX3VshCJ4Pw';

const VIDEO_DATA = [
    {
        id: 'DfK5fjVDFJ8',
        title: 'Christmas Cafe Jazz Night 🎄Soft piano and Fire Crackling Perfect for Calm Evenings'
    },
    {
        id: 'Ve4Qn_XOm1U',
        title: 'Christmas Cabin Jazz Piano Ambience 🎄Fireplace crackling & Snowy weather perfect for Focus & Relax'
    },
    {
        id: '20AHch36zA4',
        title: 'Christmas Cabin Soft Jazz Piano 🎄Fireplace, Snowy weather perfect for Focus & relaxation'
    },
    {
        id: 'Q2teAT73Fy4',
        title: 'Cozy Christmas Cabin at Night 🎄Fire crackling and soft Jazz | Snowfall & Winter Ambience'
    },
    {
        id: 'Pf0IMNvvCkE',
        title: 'Christmas Jazz Piano Ambience 🎄Snowy weather for Studying & Relaxation 💆🏻‍♀️'
    },
    {
        id: 'chNUH15xtbE',
        title: 'Christmas Cabin Jazz Piano Ambience 🎄✨ Warm Fireplace, Snowy weather for Focus & Relaxation'
    }
];

export default function Home() {
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchVideoStats();
    }, []);

    async function fetchVideoStats() {
        if (!API_KEY || API_KEY === 'YOUR_API_KEY_HERE') {
            // Fallback: show videos without view counts
            setVideos(VIDEO_DATA.map(v => ({ ...v, views: 'API Key Required' })));
            setLoading(false);
            return;
        }

        const ids = VIDEO_DATA.map(v => v.id).join(',');
        const url = `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${ids}&key=${API_KEY}`;

        try {
            const response = await fetch(url);
            const data = await response.json();

            if (data.items) {
                const videosWithStats = VIDEO_DATA.map(video => {
                    const stats = data.items.find(item => item.id === video.id);
                    const viewCount = stats?.statistics?.viewCount;
                    const views = viewCount
                        ? `${Number(viewCount).toLocaleString()} views`
                        : 'Views hidden';
                    return { ...video, views };
                });
                setVideos(videosWithStats);
            } else {
                setVideos(VIDEO_DATA.map(v => ({ ...v, views: 'Error loading views' })));
            }
        } catch (error) {
            console.error('Error fetching video stats:', error);
            setVideos(VIDEO_DATA.map(v => ({ ...v, views: 'Error loading views' })));
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className={styles.home}>
            <header className={styles.header}>
                <div className={styles.logo}>SmAnZaRy</div>
                <h1 className={styles.channelName}>Welcome to SmAnZaRy YouTube Channel</h1>
                <p className={styles.description}>
                    Cozy comfort escape environments! <br />
                    Relax with ambient jazz piano, crackling fireplaces, snowy nights, and peaceful Christmas vibes. <br />
                    Perfect for focus, study, relaxation, and calm evenings.
                </p>
                <a
                    href="https://www.youtube.com/@smanzary?sub_confirmation=1"
                    className={styles.subscribeBtn}
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    Subscribe Now
                </a>
            </header>

            <section className={styles.videosSection}>
                <h2>Featured Videos</h2>
                <div className={styles.videosGrid}>
                    {loading ? (
                        <p className={styles.loading}>Loading videos...</p>
                    ) : (
                        videos.map(video => (
                            <VideoCard key={video.id} video={video} />
                        ))
                    )}
                </div>
                <p style={{ marginTop: '40px' }}>
                    <a
                        href="https://www.youtube.com/@smanzary/videos"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        View All Videos on YouTube
                    </a>
                </p>
            </section>
        </div>
    );
}
