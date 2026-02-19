import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp, ArrowLeft, Mail, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import { PageTransition } from "@/components/PageTransition";

interface FAQItemProps {
  question: string;
  answer: string;
}

const FAQItem = ({ question, answer }: FAQItemProps) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-border/30 last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-4 px-1 text-left"
      >
        <span className="font-medium text-sm pr-4">{question}</span>
        {open ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        )}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <p className="text-sm text-muted-foreground pb-4 px-1 leading-relaxed">
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const sections = [
  {
    title: "Getting Started",
    faqs: [
      {
        question: "How do I add cards to my collection?",
        answer:
          "Head to the Search tab and type a card name. Tap any result to add it — set your quantity, condition, grading, and purchase price. You can also tap \"Add Manually\" to enter card details by hand.",
      },
      {
        question: "Can I import cards from a CSV file?",
        answer:
          "Absolutely! Go to Inventory → Import. We support TCGPlayer exports, Collectr exports, and our own template format. Just drop your CSV file and we'll auto-detect the columns. Card images are matched automatically after import.",
      },
      {
        question: "What card types do you support?",
        answer:
          "Pokemon, sports cards (baseball, basketball, football, hockey, soccer), Yu-Gi-Oh, Magic: The Gathering, One Piece, and more. If it's a collectible card, we can track it.",
      },
    ],
  },
  {
    title: "Pricing & Valuation",
    faqs: [
      {
        question: "How does pricing work?",
        answer:
          "We pull live prices from multiple sources — TCGPlayer market prices for Pokemon, plus eBay sold data and AI-powered search for sports cards and other TCGs. Prices refresh when you tap the Refresh button on your Inventory page.",
      },
      {
        question: "What is \"AI Estimated\" pricing?",
        answer:
          "When we can't find an exact match from our primary sources, we use AI to search recent eBay sales, TCGPlayer listings, and other marketplaces. The result is a median estimate labeled \"AI Est.\" — it's a solid ballpark, not an exact quote.",
      },
      {
        question: "Why does my card show \"No price data\"?",
        answer:
          "Some cards are too niche or new for our sources. Try tapping \"Reveal AI Price\" on the card detail to search the web. You can also manually set a market price by editing the card.",
      },
    ],
  },
  {
    title: "Sales & Profit Tracking",
    faqs: [
      {
        question: "How do I record a sale?",
        answer:
          "Go to Inventory, select the card(s) you want to sell, and tap \"Record Sale.\" Enter the sale price, tag the buyer if you want, and we'll calculate your profit. You can also sell in bulk — select multiple cards and record them as a single transaction.",
      },
      {
        question: "What is FIFO and how does it work?",
        answer:
          "FIFO stands for First In, First Out. When you buy the same card at different prices over time, FIFO assumes you sell the oldest (first purchased) ones first. This gives you accurate cost basis and profit calculations — just like how real businesses track inventory.",
      },
      {
        question: "What is \"Unrealized P&L\"?",
        answer:
          "That's your paper profit (or loss) — the difference between what you paid for cards you still own and what they're currently worth at market price. It's \"unrealized\" because you haven't sold them yet.",
      },
      {
        question: "What does \"Win Rate\" mean?",
        answer:
          "Win Rate is the percentage of your sales that made a profit. If you've sold 10 cards and 7 made money, your win rate is 70%. It's a quick way to see how often you're coming out ahead.",
      },
    ],
  },
  {
    title: "Grading & Condition",
    faqs: [
      {
        question: "Which grading companies do you support?",
        answer:
          "PSA, BGS (Beckett), CGC, SGC, TAG, and ACE. For ungraded cards, you can set condition as Near Mint, Lightly Played, Moderately Played, Heavily Played, or Damaged.",
      },
      {
        question: "Does grading affect the price shown?",
        answer:
          "Yes! When you select a grading company and grade (like PSA 10), we fetch the graded price specifically for that slab. A PSA 10 Charizard is worth a lot more than a raw one — and we show you both prices.",
      },
    ],
  },
  {
    title: "Import & Export",
    faqs: [
      {
        question: "What CSV formats do you accept?",
        answer:
          "We auto-detect columns from TCGPlayer Collection exports, Collectr exports, and most standard CSV formats. Just make sure your file has at least a card name column. We'll figure out the rest — set name, card number, quantity, prices, condition, and grading.",
      },
      {
        question: "How do I export my collection?",
        answer:
          "Go to Inventory → Import/Export → Export tab. You can download a CSV (for spreadsheets) or a full JSON backup. The CSV works great with Excel, Google Sheets, or for importing into other tools.",
      },
    ],
  },
];

const Help = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-safe pt-safe">
      <PageTransition>
        <main className="container mx-auto px-4 py-6 pb-28">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="gap-1.5 mb-4 -ml-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <h1 className="ios-title-large mb-1">Help & FAQ</h1>
            <p className="text-muted-foreground text-sm">
              Everything you need to know about CardLedger.
            </p>
          </motion.div>

          {/* FAQ Sections */}
          <div className="space-y-6">
            {sections.map((section, idx) => (
              <motion.div
                key={section.title}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * idx }}
                className="glass-card rounded-2xl overflow-hidden"
              >
                <div className="px-5 pt-4 pb-2">
                  <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                    {section.title}
                  </h2>
                </div>
                <div className="px-5">
                  {section.faqs.map((faq, i) => (
                    <FAQItem key={i} question={faq.question} answer={faq.answer} />
                  ))}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Contact */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-card rounded-2xl p-5 mt-6"
          >
            <h2 className="font-semibold mb-2">Still have questions?</h2>
            <p className="text-sm text-muted-foreground mb-4">
              We're real collectors too. Drop us a line and we'll get back to you.
            </p>
            <a
              href="mailto:cardledger.llc@gmail.com"
              className="inline-flex items-center gap-2 text-sm text-primary font-medium hover:underline"
            >
              <Mail className="w-4 h-4" />
              cardledger.llc@gmail.com
            </a>
          </motion.div>
        </main>
      </PageTransition>
      <BottomNav />
    </div>
  );
};

export default Help;
