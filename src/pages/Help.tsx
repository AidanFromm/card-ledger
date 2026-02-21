import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp, ArrowLeft, Mail, Search, Keyboard, BookOpen, HelpCircle, MessageSquare, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";
import { PageTransition } from "@/components/PageTransition";

interface FAQItemProps {
  question: string;
  answer: string;
  highlight?: string;
}

const FAQItem = ({ question, answer, highlight }: FAQItemProps) => {
  const [open, setOpen] = useState(false);

  const highlightText = (text: string) => {
    if (!highlight) return text;
    const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === highlight.toLowerCase()
        ? <mark key={i} className="bg-primary/20 text-primary rounded px-0.5">{part}</mark>
        : part
    );
  };

  return (
    <div className="border-b border-border/30 last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-4 px-1 text-left"
      >
        <span className="font-medium text-sm pr-4">{highlightText(question)}</span>
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
    icon: BookOpen,
    faqs: [
      { question: "How do I add cards to my collection?", answer: "Head to the Search tab and type a card name. Tap any result to add it — set your quantity, condition, grading, and purchase price. You can also tap \"Add Manually\" to enter card details by hand." },
      { question: "Can I import cards from a CSV file?", answer: "Absolutely! Go to Inventory → Import. We support TCGPlayer exports, Collectr exports, and our own template format. Just drop your CSV file and we'll auto-detect the columns. Card images are matched automatically after import." },
      { question: "What card types do you support?", answer: "Pokemon, sports cards (baseball, basketball, football, hockey, soccer), Yu-Gi-Oh, Magic: The Gathering, One Piece, and more. If it's a collectible card, we can track it." },
      { question: "How do I scan a card?", answer: "Use the Scan feature from the bottom nav. You can scan via AI camera recognition, barcode scanning, or manual search. The AI scanner identifies cards from photos of the actual card." },
    ],
  },
  {
    title: "Pricing & Valuation",
    icon: Lightbulb,
    faqs: [
      { question: "How does pricing work?", answer: "We pull live prices from multiple sources — TCGPlayer market prices for Pokemon, plus eBay sold data and AI-powered search for sports cards and other TCGs. Prices refresh when you tap the Refresh button on your Inventory page." },
      { question: "What is \"AI Estimated\" pricing?", answer: "When we can't find an exact match from our primary sources, we use AI to search recent eBay sales, TCGPlayer listings, and other marketplaces. The result is a median estimate labeled \"AI Est.\" — it's a solid ballpark, not an exact quote." },
      { question: "Why does my card show \"No price data\"?", answer: "Some cards are too niche or new for our sources. Try tapping \"Reveal AI Price\" on the card detail to search the web. You can also manually set a market price by editing the card." },
    ],
  },
  {
    title: "Sales & Profit Tracking",
    icon: HelpCircle,
    faqs: [
      { question: "How do I record a sale?", answer: "Go to Inventory, select the card(s) you want to sell, and tap \"Record Sale.\" Enter the sale price, tag the buyer if you want, and we'll calculate your profit. You can also sell in bulk — select multiple cards and record them as a single transaction." },
      { question: "What is FIFO and how does it work?", answer: "FIFO stands for First In, First Out. When you buy the same card at different prices over time, FIFO assumes you sell the oldest (first purchased) ones first. This gives you accurate cost basis and profit calculations — just like how real businesses track inventory." },
      { question: "What is \"Unrealized P&L\"?", answer: "That's your paper profit (or loss) — the difference between what you paid for cards you still own and what they're currently worth at market price. It's \"unrealized\" because you haven't sold them yet." },
      { question: "What does \"Win Rate\" mean?", answer: "Win Rate is the percentage of your sales that made a profit. If you've sold 10 cards and 7 made money, your win rate is 70%. It's a quick way to see how often you're coming out ahead." },
    ],
  },
  {
    title: "Grading & Condition",
    icon: HelpCircle,
    faqs: [
      { question: "Which grading companies do you support?", answer: "PSA, BGS (Beckett), CGC, SGC, TAG, and ACE. For ungraded cards, you can set condition as Near Mint, Lightly Played, Moderately Played, Heavily Played, or Damaged." },
      { question: "Does grading affect the price shown?", answer: "Yes! When you select a grading company and grade (like PSA 10), we fetch the graded price specifically for that slab. A PSA 10 Charizard is worth a lot more than a raw one — and we show you both prices." },
    ],
  },
  {
    title: "Import & Export",
    icon: HelpCircle,
    faqs: [
      { question: "What CSV formats do you accept?", answer: "We auto-detect columns from TCGPlayer Collection exports, Collectr exports, and most standard CSV formats. Just make sure your file has at least a card name column. We'll figure out the rest — set name, card number, quantity, prices, condition, and grading." },
      { question: "How do I export my collection?", answer: "Go to Inventory → Import/Export → Export tab. You can download a CSV (for spreadsheets) or a full JSON backup. The CSV works great with Excel, Google Sheets, or for importing into other tools." },
    ],
  },
  {
    title: "Features",
    icon: Lightbulb,
    faqs: [
      { question: "What is the Watchlist?", answer: "The Watchlist lets you track cards you're interested in without adding them to your collection. Add up to 25 cards and monitor their price changes over time. You'll see trending indicators and price change percentages." },
      { question: "How does Set Completion work?", answer: "Set Completion tracks your progress toward completing entire card sets. View progress bars for each set, see which cards you're missing, and track your percentage toward full completion." },
      { question: "Can I share my collection?", answer: "Yes! Create client lists or share your collection via a unique link. Great for showing inventory to potential buyers or trading partners." },
      { question: "What are the Stats and Trends pages?", answer: "Stats shows detailed breakdowns of your collection — by set, grading company, price distribution, and more. Trends shows market-wide data and price movements for popular cards." },
    ],
  },
];

const keyboardShortcuts = [
  { keys: ["Ctrl", "K"], action: "Open command palette / search" },
  { keys: ["Ctrl", "N"], action: "Add new card" },
  { keys: ["/"], action: "Focus search bar" },
  { keys: ["Esc"], action: "Close dialog / cancel" },
  { keys: ["?"], action: "Show keyboard shortcuts" },
];

const Help = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");

  const filteredSections = useMemo(() => {
    if (!searchTerm.trim()) return sections;
    const term = searchTerm.toLowerCase();
    return sections
      .map(section => ({
        ...section,
        faqs: section.faqs.filter(
          faq =>
            faq.question.toLowerCase().includes(term) ||
            faq.answer.toLowerCase().includes(term)
        ),
      }))
      .filter(section => section.faqs.length > 0);
  }, [searchTerm]);

  const totalResults = filteredSections.reduce((s, sec) => s + sec.faqs.length, 0);

  return (
    <div className="min-h-screen bg-background pb-safe pt-safe">
      <Navbar />
      <PageTransition>
        <main className="container mx-auto px-4 py-6 pb-28 md:pb-8 max-w-6xl">
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

          {/* Search */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="mb-6"
          >
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search help articles..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-9 h-11 rounded-xl bg-secondary/30 border-border/50"
              />
            </div>
            {searchTerm && (
              <p className="text-xs text-muted-foreground mt-2">
                {totalResults} result{totalResults !== 1 ? 's' : ''} found
              </p>
            )}
          </motion.div>

          {/* Getting Started Guide */}
          {!searchTerm && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 }}
              className="glass-card rounded-2xl p-5 mb-6"
            >
              <h2 className="font-semibold mb-3 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-primary" />
                Quick Start Guide
              </h2>
              <div className="space-y-3">
                {[
                  { step: "1", title: "Add your first card", desc: "Search or scan to add cards to your collection" },
                  { step: "2", title: "Track prices", desc: "Prices update automatically from market sources" },
                  { step: "3", title: "Record sales", desc: "Log sales to track profit and performance" },
                  { step: "4", title: "Analyze", desc: "View stats, trends, and set completion progress" },
                ].map(item => (
                  <div key={item.step} className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-primary">{item.step}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium">{item.title}</p>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* FAQ Sections */}
          <div className="space-y-6">
            {filteredSections.map((section, idx) => (
              <motion.div
                key={section.title}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * idx }}
                className="glass-card rounded-2xl overflow-hidden"
              >
                <div className="px-5 pt-4 pb-2 flex items-center gap-2">
                  <section.icon className="w-4 h-4 text-muted-foreground" />
                  <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                    {section.title}
                  </h2>
                </div>
                <div className="px-5">
                  {section.faqs.map((faq, i) => (
                    <FAQItem key={i} question={faq.question} answer={faq.answer} highlight={searchTerm || undefined} />
                  ))}
                </div>
              </motion.div>
            ))}
          </div>

          {filteredSections.length === 0 && (
            <div className="text-center py-12">
              <Search className="h-10 w-10 mx-auto mb-3 text-muted-foreground/20" />
              <p className="text-sm text-muted-foreground">No results for "{searchTerm}"</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Try different keywords</p>
            </div>
          )}

          {/* Keyboard Shortcuts */}
          {!searchTerm && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="glass-card rounded-2xl p-5 mt-6"
            >
              <h2 className="font-semibold mb-3 flex items-center gap-2">
                <Keyboard className="w-4 h-4 text-muted-foreground" />
                Keyboard Shortcuts
              </h2>
              <div className="space-y-2">
                {keyboardShortcuts.map(shortcut => (
                  <div key={shortcut.action} className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{shortcut.action}</span>
                    <div className="flex items-center gap-1">
                      {shortcut.keys.map(key => (
                        <kbd key={key} className="px-2 py-0.5 text-[11px] font-mono bg-secondary/50 rounded-md border border-border/30">
                          {key}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Contact & Feedback */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-card rounded-2xl p-5 mt-6"
          >
            <h2 className="font-semibold mb-2 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-muted-foreground" />
              Still have questions?
            </h2>
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
