import { Link } from "react-router-dom";
import { ArrowRight, Compass, MapPin, MapPinCheckInside, Star } from 'lucide-react';

import { useAuth } from "../context/useAuth";
import styles from "./HomePage.module.css";

export default function HomePage() {
    const { user, loading } = useAuth()
    const isLoggedIn = !!user

    return (
        <main className="container page">
            <div className="shell">
                <nav className="topbar" aria-label="Main navigation">
                    <Link to="/" aria-label="CityQuest home">
                        CityQuest
                    </Link>
                    {!loading && !isLoggedIn && (
                        <Link className="button login-button" to="/login">
                        Log In
                        </Link>
                    )}
                </nav>
                {/* Hero card */}
                <section className={styles.hero}>
                    <div className={styles.logoContainer}>
                        <MapPin size={80} className={styles.logoIcon}/>
                        <div className={styles.logo}>CityQuest</div>
                        <p className={styles.tagline}>Explore. Discover. Belong.</p>
                    </div>
                    <p className={styles.description}>
                        CityQuest is a GPS-based adventure game that turns your city into a quest log.
                        Discover new places, complete interesting challenges, and earn rewards as you explore your city.
                    </p>
                    <Link className={styles.adventureButton} to="/map">
                        <span className={styles.adventureButtonContent}>
                            Start Your Adventure <ArrowRight />
                        </span>
                    </Link>
                </section>
                {/* Features section */}
                <section className={styles.cardGrid}>
                    <section className={styles.card}>
                        <Compass fill='#6388ff' />
                        <h2>Discover</h2>
                        <p>Find hidden spots and interesting landmarks.</p>
                    </section>

                    <section className={styles.card}>
                        <MapPinCheckInside fill='#52e23f' />
                        <h2>Complete Quests</h2>
                        <p>Visit locations, complete challenges, and earn rewards.</p>
                    </section>

                    <section className={styles.card}>
                        <Star fill='#ffc107' />
                        <h2>Earn Rewards</h2>
                        <p>Unlock badges as you complete milestones.</p>
                    </section>
                </section>
                <section className={styles.instructions}>
                    <h2 className={styles.center}>How It Works</h2>
                    <ul>
                        <li>
                            <h3>Open the Map</h3>
                            <p>See nearby landmarks and hidden gems in real-time</p>
                        </li>

                        <li>
                            <h3>Visit Locations</h3>
                            <p>Walk to spots and check them off with GPS check-ins</p>
                        </li>

                        <li>
                            <h3>Complete Quests</h3>
                            <p>Finish challenges to earn XP, level up and earn badges</p>
                        </li>
                    </ul>
                </section>
                <div>
                    <Link className={`${styles.adventureButton} ${styles.maxWidth}`} to="/map">
                        <span className={styles.adventureButtonContent}>
                            Start Your Adventure <ArrowRight />
                        </span>
                    </Link>
                </div>
            </div>
        </main>
    )
}