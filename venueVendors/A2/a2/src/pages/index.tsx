import Head from "next/head";
import Link from "next/link";
import { Footer } from "../Components/Footer";
import { Header } from "../Components/Header";
import useFadeInHook from "@/Components/useFadeInHook";

export default function Home() {
  const { ref, isVisible } = useFadeInHook();

  return (
    <>
      <Head>
        <title>Venue Vendors</title>
        <meta name="description" content="Manage venues with ease" />
      </Head>

      <Header />

      <main className="home-page">
        <section
          ref={ref}
          className={`home-hero fade-in ${isVisible ? "visible" : ""}`}
        >
          <div className="hero-overlay">
            <div className="hero-content">
              <p className="hero-label">Hiring Or Hosting, We've Got You. </p>
              <h1>Venues Made Easy!</h1>
              <p>
                Find venues, manage bookings, approve hirers, and keep your
                venue operations organised in one place.
              </p>

              <div className="hero-buttons">
                <Link href="/signUp" className="primary-button">
                  Sign Up
                </Link>

                <Link href="/login" className="secondary-button">
                  Already A Member?
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="services-section">
          <p className="section-label">Our services</p>
          <h2 className="services-h2">Everything you need for venue hiring</h2>

          <div className="services-grid">
            <article className="services-card">
              <img
                src="https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=900&q=80"
                alt="Elegant event venue"
              />

              <div className="services-card-content">
                <h3>Hire a Venue</h3>
                <p>
                  Browse available venues by location, capacity, and event
                  suitability. Select your preferred venue and submit a booking
                  application.
                </p>

                <Link className="service-link" href="/hirer">
                  Start hiring
                </Link>
              </div>
            </article>

            <article className="services-card">
              <img
                src="https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=900&q=80"
                alt="People reviewing venue applications"
              />

              <div className="services-card-content">
                <h3>Select an Applicant</h3>
                <p>
                  Vendors can review hirer applications, approve or reject
                  bookings, block unavailable dates, and manage and create venues details.
                </p>

                <Link className="service-link" href="/vendor">
                  View applicants
                </Link>
              </div>
            </article>


          </div>
        </section>

        <section className="bottom-cta">
          <div>
            <p className="section-label">Ready to begin?</p>
            <h2>Upgrade your venue experience</h2>
            <p>
              Join now and make venue hiring, booking, and management easier
              than ever.
            </p>
          </div>

          <Link href="/signUp" className="sign-up-button">
            Get started now
          </Link>
        </section>
      </main>

      <Footer />
    </>
  );
}