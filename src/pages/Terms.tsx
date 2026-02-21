import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft, FileText } from "lucide-react";

const Terms = () => {
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
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Terms of Service</h1>
              <p className="text-sm text-muted-foreground">Last updated: February 20, 2026</p>
            </div>
          </div>

          <div className="prose prose-invert prose-sm max-w-none space-y-6">
            <section>
              <h2 className="text-xl font-semibold mb-3">1. Acceptance of Terms</h2>
              <p className="text-muted-foreground leading-relaxed">
                By accessing or using CardLedger ("the Service"), you agree to be bound by these Terms of Service. 
                If you do not agree to these terms, do not use the Service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">2. Description of Service</h2>
              <p className="text-muted-foreground leading-relaxed">
                CardLedger is a collectible card portfolio tracking application that allows users to manage their 
                card collections, view market pricing, track profits and losses, and analyze their portfolios. 
                We aggregate pricing data from third-party sources and provide it for informational purposes only.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">3. Pricing Disclaimer</h2>
              <p className="text-muted-foreground leading-relaxed">
                <strong className="text-foreground">Card prices displayed in CardLedger are estimates based on third-party data sources 
                and should not be treated as guaranteed or actual market values.</strong> Prices may vary based on condition, 
                market conditions, and individual transactions. CardLedger is not a marketplace and does not facilitate 
                the buying or selling of cards. We are not responsible for any financial decisions made based on 
                pricing information displayed in our application.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">4. User Accounts</h2>
              <p className="text-muted-foreground leading-relaxed">
                You are responsible for maintaining the security of your account credentials. You must provide 
                accurate information when creating an account. You may not use the Service for any illegal purpose 
                or to violate any laws.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">5. Subscriptions & Payments</h2>
              <p className="text-muted-foreground leading-relaxed">
                CardLedger offers free and paid subscription tiers. Paid subscriptions are billed through Stripe. 
                You may cancel your subscription at any time through your account settings or the Stripe customer portal. 
                Refunds are handled on a case-by-case basis — contact us within 7 days of purchase for a full refund. 
                Lifetime plans are non-refundable after 30 days.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">6. Intellectual Property</h2>
              <p className="text-muted-foreground leading-relaxed">
                CardLedger and its original content, features, and functionality are owned by CardLedger LLC. 
                Card images and names are trademarks of their respective owners (The Pokemon Company, Wizards of the Coast, etc.) 
                and are used for identification purposes only.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">7. Limitation of Liability</h2>
              <p className="text-muted-foreground leading-relaxed">
                CardLedger shall not be liable for any indirect, incidental, special, consequential, or punitive damages 
                resulting from your use of the Service. Our total liability shall not exceed the amount you paid us 
                in the 12 months preceding the claim.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">8. Changes to Terms</h2>
              <p className="text-muted-foreground leading-relaxed">
                We reserve the right to modify these terms at any time. We will notify users of material changes 
                via email or in-app notification. Continued use of the Service after changes constitutes acceptance.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">9. Contact</h2>
              <p className="text-muted-foreground leading-relaxed">
                Questions about these Terms? Contact us at{" "}
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

export default Terms;
