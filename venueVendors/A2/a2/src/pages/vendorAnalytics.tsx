import Head from "next/head";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    Legend,
    PieChart,
    Pie,
    Cell,
    LineChart,
    Line,
    CartesianGrid,
    ResponsiveContainer,
} from "recharts";
import { Header } from "@/Components/Header";
import { Footer } from "@/Components/Footer";
import { useAuth } from "@/Context/AuthContext";
import { vendorApi } from "@/services/vendorApi";

interface VenueHirerTally {
    venueName: string;
    hirerName: string;
    tally: number;
}

interface CombinedHirerTally {
    hirerName: string;
    tally: number;
}

interface ActiveHirer {
    hirerName: string;
    tally: number;
}

interface UtilisationItem {
    date: string;
    bookings: number;
}

interface VendorAnalyticsData {
    venueHirerTallies: VenueHirerTally[];
    combinedHirerTallies: CombinedHirerTally[];
    mostActiveHirer: ActiveHirer | null;
    leastActiveHirer: ActiveHirer | null;
    utilisationOverTime: UtilisationItem[];
}

export default function VendorAnalytics() {
    const { currentUser, isLoading } = useAuth();
    const router = useRouter();

    const [timeRange, setTimeRange] = useState("all");
    const [analytics, setAnalytics] = useState<VendorAnalyticsData | null>(null);
    const [pageError, setPageError] = useState("");
    const [isPageLoading, setIsPageLoading] = useState(true);

    useEffect(() => {
        if (!isLoading && (!currentUser || currentUser.role !== "vendor")) {
            router.push("/login");
        }
    }, [currentUser, isLoading, router]);

    useEffect(() => {
        const loadAnalytics = async () => {
            if (!currentUser?.id) return;

            setIsPageLoading(true);
            setPageError("");

            try {
                const data = await vendorApi.getVendorAnalytics(
                    currentUser.id,
                    timeRange
                );

                setAnalytics(data);
            } catch (error) {
                setPageError(
                    error instanceof Error
                        ? error.message
                        : "Unable to load vendor analytics."
                );
            } finally {
                setIsPageLoading(false);
            }
        };

        void loadAnalytics();
    }, [currentUser, timeRange]);

    if (isLoading || isPageLoading) {
        return (
            <>
                <Header />
                <main className="vendor-analytics-page">
                    <div className="analytics-loading">Loading analytics...</div>
                </main>
                <Footer />
            </>
        );
    }

    if (!currentUser || currentUser.role !== "vendor") {
        return null;
    }

    const activeHirerData = [
        analytics?.mostActiveHirer
            ? {
                name: `Most active: ${analytics.mostActiveHirer.hirerName}`,
                value: analytics.mostActiveHirer.tally,
            }
            : null,
        analytics?.leastActiveHirer
            ? {
                name: `Least active: ${analytics.leastActiveHirer.hirerName}`,
                value: analytics.leastActiveHirer.tally,
            }
            : null,
    ].filter(Boolean) as { name: string; value: number }[];

    return (
        <>
            <Head>
                <title>Vendor Analytics</title>
            </Head>

            <Header />

            <main className="vendor-analytics-page">
                <div className="analytics-container">
                    <section className="analytics-header">
                        <h1>Vendor Analytics Dashboard</h1>
                        <p>Track venue performance, hirer activity, and booking trends.</p>

                        <div className="analytics-controls">
                            <label>Time period: </label>
                            <select
                                value={timeRange}
                                onChange={(e) => setTimeRange(e.target.value)}
                            >
                                <option value="week">This week</option>
                                <option value="month">This month</option>
                                <option value="lastMonth">Last month</option>
                                <option value="all">All time</option>
                            </select>
                        </div>
                    </section>

                    {pageError && <div className="analytics-error">{pageError}</div>}

                    <section className="analytics-summary">
                        <div className="summary-card">
                            <h3>Most Active Hirer</h3>
                            <p>
                                {analytics?.mostActiveHirer
                                    ? `${analytics.mostActiveHirer.hirerName} - ${analytics.mostActiveHirer.tally} bookings`
                                    : "No data"}
                            </p>
                        </div>

                        <div className="summary-card">
                            <h3>Least Active Hirer</h3>
                            <p>
                                {analytics?.leastActiveHirer
                                    ? `${analytics.leastActiveHirer.hirerName} - ${analytics.leastActiveHirer.tally} bookings`
                                    : "No data"}
                            </p>
                        </div>
                    </section>

                    <section className="analytics-grid">
                        <div className="analytics-card">
                            <h2>1. Hirer tallies for each venue</h2>

                            <div className="chart-wrapper">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={analytics?.venueHirerTallies || []}>
                                        <XAxis dataKey="hirerName" />
                                        <YAxis />
                                        <Tooltip />
                                        <Legend />
                                        <Bar dataKey="tally" name="Bookings" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="analytics-card">
                            <h2>2. Combined hirer tallies across all venues</h2>

                            <div className="chart-wrapper">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={analytics?.combinedHirerTallies || []}>
                                        <XAxis dataKey="hirerName" />
                                        <YAxis />
                                        <Tooltip />
                                        <Legend />
                                        <Bar dataKey="tally" name="Total Bookings" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="analytics-card">
                            <h2>3. Most and least active hirers</h2>

                            <div className="chart-wrapper">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={activeHirerData}
                                            dataKey="value"
                                            nameKey="name"
                                            outerRadius={120}
                                            label
                                        >
                                            {activeHirerData.map((_, index) => (
                                                <Cell key={index} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="analytics-card">
                            <h2>4. Venue utilisation over time</h2>

                            <div className="chart-wrapper">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={analytics?.utilisationOverTime || []}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="date" />
                                        <YAxis />
                                        <Tooltip />
                                        <Legend />
                                        <Line
                                            type="monotone"
                                            dataKey="bookings"
                                            name="Bookings"
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </section>
                </div>
            </main>

            <Footer />
        </>
    );
}