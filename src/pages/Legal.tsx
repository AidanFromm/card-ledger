import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import { PageTransition } from "@/components/PageTransition";

type Tab = "terms" | "privacy";

const Legal = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("terms");

  return (
    <div className="min-h-screen bg-background pb-safe pt-safe">
      <PageTransition>
        <main className="container mx-auto px-4 py-6 pb-28">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-1.5 mb-4 -ml-2">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>

            <h1 className="ios-title-large mb-4">Legal</h1>

            {/* Tab Switcher */}
            <div className="flex gap-1 bg-secondary/30 rounded-xl p-1 mb-6">
              <button
                onClick={() => setTab("terms")}
                className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${
                  tab === "terms" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
                }`}
              >
                Terms of Service
              </button>
              <button
                onClick={() => setTab("privacy")}
                className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${
                  tab === "privacy" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
                }`}
              >
                Privacy Policy
              </button>
            </div>
          </motion.div>

          {tab === "terms" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="prose prose-sm dark:prose-invert max-w-none space-y-5 text-sm text-muted-foreground leading-relaxed">
              <p className="text-xs text-muted-foreground/70">Last updated: February 19, 2026</p>

              <section>
                <h2 className="text-base font-semibold text-foreground">1. Welcome to CardLedger</h2>
                <p>
                  CardLedger ("we", "us", "our") provides a mobile and web application for tracking collectible card
                  inventories, market prices, and portfolio analytics. By creating an account or using CardLedger, you
                  agree to these Terms of Service.
                </p>
              </section>

              <section>
                <h2 className="text-base font-semibold text-foreground">2. Your Account</h2>
                <p>
                  You're responsible for keeping your login credentials secure. One account per person — don't share
                  access. You must be at least 13 years old (or the minimum age in your jurisdiction) to use CardLedger.
                </p>
              </section>

              <section>
                <h2 className="text-base font-semibold text-foreground">3. What CardLedger Is (and Isn't)</h2>
                <p>
                  CardLedger is a <strong>personal inventory and analytics tool</strong>. We are not a marketplace, broker,
                  financial advisor, or appraisal service. Prices shown are estimates from third-party sources and should
                  not be treated as guaranteed valuations or offers to buy/sell.
                </p>
              </section>

              <section>
                <h2 className="text-base font-semibold text-foreground">4. Pricing Data</h2>
                <p>
                  Market prices come from third-party APIs including Pokemon TCG API, Tavily AI search (which
                  references eBay, TCGPlayer, and other marketplaces), and Scrydex. We do our best to show
                  accurate data, but prices fluctuate constantly and we cannot guarantee accuracy.
                </p>
              </section>

              <section>
                <h2 className="text-base font-semibold text-foreground">5. Your Data</h2>
                <p>
                  You own your inventory data. You can export it anytime (CSV or JSON). We won't sell your personal
                  collection data to third parties. If you delete your account, we'll remove your data from our systems.
                </p>
              </section>

              <section>
                <h2 className="text-base font-semibold text-foreground">6. Acceptable Use</h2>
                <p>
                  Don't abuse our APIs, attempt to scrape data in bulk, reverse-engineer the app, or use CardLedger for
                  any illegal purpose. Don't try to access other users' data. Be cool.
                </p>
              </section>

              <section>
                <h2 className="text-base font-semibold text-foreground">7. Subscriptions & Billing</h2>
                <p>
                  Some features require a paid subscription. Prices are listed in the app. Subscriptions renew
                  automatically unless canceled. Refunds follow the policies of the App Store or Google Play.
                </p>
              </section>

              <section>
                <h2 className="text-base font-semibold text-foreground">8. Limitation of Liability</h2>
                <p>
                  CardLedger is provided "as is." We're not liable for any financial decisions you make based on prices
                  shown in the app, data loss due to outages, or any indirect damages. Our total liability is limited to
                  the amount you've paid us in the past 12 months.
                </p>
              </section>

              <section>
                <h2 className="text-base font-semibold text-foreground">9. Changes to These Terms</h2>
                <p>
                  We may update these terms. We'll notify you of significant changes via email or in-app notice. Continued
                  use after changes means you accept the updated terms.
                </p>
              </section>

              <section>
                <h2 className="text-base font-semibold text-foreground">10. Contact</h2>
                <p>
                  Questions? Email us at{" "}
                  <a href="mailto:cardledger.llc@gmail.com" className="text-primary hover:underline">
                    cardledger.llc@gmail.com
                  </a>.
                </p>
              </section>
            </motion.div>
          )}

          {tab === "privacy" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="prose prose-sm dark:prose-invert max-w-none space-y-5 text-sm text-muted-foreground leading-relaxed">
              <p className="text-xs text-muted-foreground/70">Last updated: February 19, 2026</p>

              <section>
                <h2 className="text-base font-semibold text-foreground">What We Collect</h2>
                <p>
                  <strong>Account info:</strong> Email address and password (hashed). That's it for personal info.
                </p>
                <p>
                  <strong>Inventory data:</strong> The cards, prices, grading, and sales you enter. Stored securely in our
                  database (Supabase / PostgreSQL) and only accessible by you.
                </p>
                <p>
                  <strong>Usage data:</strong> Basic analytics like page views and feature usage to help us improve the app.
                  No ad tracking.
                </p>
              </section>

              <section>
                <h2 className="text-base font-semibold text-foreground">Third-Party Services</h2>
                <p>We use the following services to power CardLedger:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong>Supabase</strong> — Authentication and database hosting (your data is stored here)</li>
                  <li><strong>Pokemon TCG API</strong> — Card data and TCGPlayer market prices</li>
                  <li><strong>Tavily AI</strong> — Web search for real-time price estimates from eBay, TCGPlayer, etc.</li>
                  <li><strong>Scrydex</strong> — Sealed product and graded card pricing</li>
                  <li><strong>eBay Browse API</strong> — Sold listing prices (when available)</li>
                  <li><strong>PSA API</strong> — Certification verification</li>
                </ul>
                <p>
                  These services receive search queries (card names) to return pricing data. They do not receive your
                  personal information or inventory data.
                </p>
              </section>

              <section>
                <h2 className="text-base font-semibold text-foreground">How We Protect Your Data</h2>
                <p>
                  All data is transmitted over HTTPS. Your inventory is protected by Row Level Security — only you can
                  access your data, even at the database level. Passwords are hashed and never stored in plain text.
                </p>
              </section>

              <section>
                <h2 className="text-base font-semibold text-foreground">Data Storage & Offline</h2>
                <p>
                  CardLedger caches your inventory locally (IndexedDB) for offline access and faster loading. This data
                  stays on your device and syncs with our servers when you're back online.
                </p>
              </section>

              <section>
                <h2 className="text-base font-semibold text-foreground">Your Rights</h2>
                <p>You can:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong>Export</strong> all your data anytime (Inventory → Export)</li>
                  <li><strong>Delete</strong> your account and all associated data (Profile → Privacy & Security)</li>
                  <li><strong>Correct</strong> any data by editing items in your inventory</li>
                </ul>
              </section>

              <section>
                <h2 className="text-base font-semibold text-foreground">Cookies & Local Storage</h2>
                <p>
                  We use localStorage for app preferences (theme, onboarding status) and IndexedDB for offline caching.
                  No third-party tracking cookies.
                </p>
              </section>

              <section>
                <h2 className="text-base font-semibold text-foreground">Children's Privacy</h2>
                <p>
                  CardLedger is not designed for children under 13. We do not knowingly collect data from children. If you
                  believe a child has created an account, contact us and we'll remove it.
                </p>
              </section>

              <section>
                <h2 className="text-base font-semibold text-foreground">Contact</h2>
                <p>
                  Privacy questions? Reach us at{" "}
                  <a href="mailto:cardledger.llc@gmail.com" className="text-primary hover:underline">
                    cardledger.llc@gmail.com
                  </a>.
                </p>
              </section>
            </motion.div>
          )}
        </main>
      </PageTransition>
      <BottomNav />
    </div>
  );
};

export default Legal;
