import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft, Shield } from "lucide-react";

const Privacy = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back to CardLedger
        </Link>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Privacy Policy</h1>
              <p className="text-sm text-muted-foreground">Last updated: February 20, 2026</p>
            </div>
          </div>

          <div className="prose prose-invert prose-sm max-w-none space-y-6">
            <section>
              <h2 className="text-xl font-semibold mb-3">1. Information We Collect</h2>
              <p className="text-muted-foreground leading-relaxed">
                When you create a CardLedger account, we collect your email address and authentication credentials. 
                When you use our services, we collect information about your card collection, including card names, 
                quantities, purchase prices, and grading information that you voluntarily provide.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">2. How We Use Your Information</h2>
              <p className="text-muted-foreground leading-relaxed">
                We use your information to: provide and maintain CardLedger services, calculate portfolio values 
                using market pricing data, generate analytics and reports about your collection, send you price 
                alerts and notifications (if enabled), and improve our services.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">3. Data Storage & Security</h2>
              <p className="text-muted-foreground leading-relaxed">
                Your data is stored securely using Supabase (powered by PostgreSQL) with row-level security enabled. 
                All data is encrypted in transit using TLS 1.3. We do not sell, trade, or share your personal 
                information with third parties. Only you can access your collection data.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">4. Third-Party Services</h2>
              <p className="text-muted-foreground leading-relaxed">
                We use third-party APIs to provide market pricing data (JustTCG, Pokemon TCG API, eBay). 
                These services receive card identifiers to fetch pricing but do not receive your personal information. 
                We use Stripe for payment processing. Stripe handles all payment information directly — 
                we never store your credit card details.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">5. Data Export & Deletion</h2>
              <p className="text-muted-foreground leading-relaxed">
                You can export your complete collection data at any time from your Profile settings (JSON or CSV format). 
                To delete your account and all associated data, contact us at cardledger.llc@gmail.com. 
                Account deletion is permanent and irreversible.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">6. Cookies & Local Storage</h2>
              <p className="text-muted-foreground leading-relaxed">
                We use local storage to cache your preferences (theme, default settings) and session tokens 
                for authentication. We do not use third-party tracking cookies. Our analytics are minimal 
                and privacy-respecting.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">7. Contact Us</h2>
              <p className="text-muted-foreground leading-relaxed">
                If you have questions about this Privacy Policy, contact us at{" "}
                <a href="mailto:cardledger.llc@gmail.com" className="text-primary hover:underline">
                  cardledger.llc@gmail.com
                </a>
              </p>
            </section>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Privacy;
