import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Shield, Award, Star, Info, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import Navbar from "@/components/Navbar";
import { PageTransition } from "@/components/PageTransition";

type Company = "PSA" | "BGS" | "CGC";

interface GradeInfo {
  grade: string;
  label: string;
  description: string;
  tips: string;
  color: string;
}

const PSA_GRADES: GradeInfo[] = [
  { grade: "10", label: "Gem Mint", description: "Virtually perfect in every way. No visible flaws under 10x magnification.", tips: "Centering must be 55/45 or better on front, 75/25 on back.", color: "text-emerald-500" },
  { grade: "9", label: "Mint", description: "A superb condition card with only one minor flaw. Great eye appeal.", tips: "One tiny imperfection — small wax stain on back, slight off-center.", color: "text-emerald-400" },
  { grade: "8", label: "NM-MT", description: "Near Mint to Mint. A super high-end card with only slight wear.", tips: "Very slight wax staining, slight fraying at corners.", color: "text-blue-500" },
  { grade: "7", label: "Near Mint", description: "Just a slight surface wear, slight fraying on corners.", tips: "A minor flaw like a small print spot or slight corner wear.", color: "text-blue-400" },
  { grade: "6", label: "EX-MT", description: "Excellent to Mint. Visible flaws but still presentable.", tips: "Slight notching on edges, light scratching, off-center.", color: "text-yellow-500" },
  { grade: "5", label: "Excellent", description: "Moderate wear. Card has been handled but not abused.", tips: "Light creases, moderate corner wear, minor staining.", color: "text-yellow-400" },
  { grade: "4", label: "VG-EX", description: "Noticeable wear. Corners show significant rounding.", tips: "Corners heavily rounded, moderate creasing.", color: "text-orange-500" },
  { grade: "3", label: "VG", description: "Very Good. Significant wear throughout.", tips: "Creasing visible, heavy corner wear, possible staining.", color: "text-orange-400" },
  { grade: "2", label: "Good", description: "Heavily worn. Major creases, heavy staining possible.", tips: "Tape residue, writing, or major damage present.", color: "text-red-400" },
  { grade: "1", label: "Poor", description: "Severe damage. Card is complete but barely.", tips: "Only grade if card is rare/valuable enough to slab.", color: "text-red-500" },
];

const BGS_GRADES: GradeInfo[] = [
  { grade: "10 (Pristine)", label: "Pristine", description: "The holy grail — flawless in every category. Extremely rare.", tips: "All four sub-grades must be 10. Less than 1% of submissions.", color: "text-emerald-500" },
  { grade: "10 (Black Label)", label: "Black Label", description: "Perfect 10 in all four sub-grades with the coveted black label.", tips: "Centering, corners, edges, and surface all perfect 10.", color: "text-purple-500" },
  { grade: "9.5", label: "Gem Mint", description: "Outstanding card. The BGS equivalent of a PSA 10 in value.", tips: "At least three sub-grades of 9.5+, no sub-grade below 9.", color: "text-emerald-400" },
  { grade: "9", label: "Mint", description: "Excellent condition with very minor imperfections.", tips: "Sub-grades average 9.0. Minor centering or surface issues.", color: "text-blue-500" },
  { grade: "8.5", label: "NM-MT+", description: "Between NM-MT and Mint. Very desirable grade.", tips: "Slight corner or edge wear. Good eye appeal.", color: "text-blue-400" },
  { grade: "8", label: "NM-MT", description: "Near Mint to Mint. Light wear visible on close inspection.", tips: "Minor corner softness or slight edge wear.", color: "text-yellow-500" },
  { grade: "7", label: "Near Mint", description: "Minor wear visible. Still a solid card.", tips: "Noticeable corner wear, possible minor surface scratches.", color: "text-yellow-400" },
  { grade: "6", label: "EX-MT", description: "Moderate wear throughout. Still collectible.", tips: "Visible wear on corners and edges. Light creasing.", color: "text-orange-500" },
];

const CGC_GRADES: GradeInfo[] = [
  { grade: "10 (Perfect)", label: "Perfect", description: "Absolutely flawless — the highest possible grade.", tips: "Virtually impossible to achieve. Factory-fresh perfection.", color: "text-emerald-500" },
  { grade: "10 (Pristine)", label: "Pristine", description: "Nearly perfect with imperceptible imperfections.", tips: "Sub-grades all 10. Extremely difficult to obtain.", color: "text-emerald-400" },
  { grade: "9.5", label: "Gem Mint", description: "Outstanding quality. Among the finest examples.", tips: "All sub-grades 9.5 or higher. Excellent centering.", color: "text-blue-500" },
  { grade: "9", label: "Mint", description: "Superb condition with minor imperfections.", tips: "Slight centering variance or minor surface issues.", color: "text-blue-400" },
  { grade: "8.5", label: "NM/Mint+", description: "Between NM/Mint and Mint grade.", tips: "Very minor corner or edge imperfections.", color: "text-yellow-500" },
  { grade: "8", label: "NM/Mint", description: "Near Mint to Mint. Minor wear visible.", tips: "Light corner wear or minor print imperfections.", color: "text-yellow-400" },
  { grade: "7", label: "Near Mint", description: "Slight surface wear, minor corner wear.", tips: "Visible but minor flaws. Good overall appeal.", color: "text-orange-500" },
  { grade: "6", label: "EX/NM", description: "Moderate wear. Still appealing card.", tips: "Noticeable corner/edge wear. Possible light creases.", color: "text-orange-400" },
];

const COMPANIES: { key: Company; label: string; color: string; description: string }[] = [
  { key: "PSA", label: "PSA", color: "bg-red-500", description: "Professional Sports Authenticator — the most popular grading service. Grades 1–10 scale." },
  { key: "BGS", label: "BGS", color: "bg-blue-600", description: "Beckett Grading Services — uses sub-grades (centering, corners, edges, surface). Half-point scale." },
  { key: "CGC", label: "CGC", color: "bg-emerald-600", description: "Certified Guaranty Company — newer to cards, uses sub-grades similar to BGS." },
];

const GRADES_MAP: Record<Company, GradeInfo[]> = {
  PSA: PSA_GRADES,
  BGS: BGS_GRADES,
  CGC: CGC_GRADES,
};

const TIPS = [
  { title: "Handle with Care", tip: "Always use clean hands or gloves. Hold cards by edges only. Never touch the surface." },
  { title: "Use Penny Sleeves First", tip: "Always put cards in a penny sleeve before a top loader or card saver. Double sleeving protects edges." },
  { title: "Centering Matters", tip: "Check centering before submitting. Use a centering tool app. 60/40 or worse usually won't get a 10." },
  { title: "Surface Scratches", tip: "Hold the card under a bright light at an angle. Holo cards often show micro-scratches that drop grades." },
  { title: "Choose Your Service", tip: "PSA for resale value (most liquid). BGS for modern cards (sub-grades add detail). CGC is growing fast." },
  { title: "Submission Tips", tip: "Use Card Savers (not top loaders) for PSA. Declare accurate value. Consider bulk submission for savings." },
];

const ExpandableGrade = ({ grade }: { grade: GradeInfo }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-border/20 last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-3 px-1 text-left"
        aria-expanded={open}
        aria-label={`Grade ${grade.grade} - ${grade.label}`}
      >
        <div className="flex items-center gap-3">
          <span className={`text-lg font-bold font-mono w-16 ${grade.color}`}>{grade.grade}</span>
          <span className="font-medium text-sm">{grade.label}</span>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="pb-3 px-1 space-y-2">
              <p className="text-sm text-muted-foreground">{grade.description}</p>
              <div className="flex items-start gap-2 p-2.5 rounded-xl bg-primary/5 border border-primary/10">
                <Info className="w-3.5 h-3.5 text-primary mt-0.5 flex-shrink-0" />
                <p className="text-xs text-primary/80">{grade.tips}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const GradingGuide = () => {
  const navigate = useNavigate();
  const [activeCompany, setActiveCompany] = useState<Company>("PSA");

  const company = COMPANIES.find(c => c.key === activeCompany)!;
  const grades = GRADES_MAP[activeCompany];

  return (
    <div className="min-h-screen bg-background pb-safe pt-safe">
      <Navbar />
      <PageTransition>
        <main className="container mx-auto px-4 py-6 pb-28 max-w-2xl">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-1.5 mb-4 -ml-2" aria-label="Go back">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>

            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Grading Guide</h1>
                <p className="text-sm text-muted-foreground">Understand PSA, BGS & CGC scales</p>
              </div>
            </div>
          </motion.div>

          {/* Company Selector */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="mt-6 mb-4"
          >
            <div className="flex gap-1 bg-secondary/30 rounded-xl p-1">
              {COMPANIES.map(c => (
                <button
                  key={c.key}
                  onClick={() => setActiveCompany(c.key)}
                  className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                    activeCompany === c.key
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  aria-label={`View ${c.label} grading scale`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Company Description */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="p-4 rounded-2xl bg-secondary/30 border border-border/20 mb-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-3 h-3 rounded-full ${company.color}`} />
              <h3 className="font-semibold text-sm">{company.label}</h3>
            </div>
            <p className="text-sm text-muted-foreground">{company.description}</p>
          </motion.div>

          {/* Grade Scale */}
          <motion.div
            key={activeCompany}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl bg-secondary/20 border border-border/20 overflow-hidden mb-6"
          >
            <div className="px-4 pt-4 pb-2">
              <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                <Award className="w-4 h-4" />
                {activeCompany} Grading Scale
              </h3>
            </div>
            <div className="px-4">
              {grades.map(grade => (
                <ExpandableGrade key={grade.grade} grade={grade} />
              ))}
            </div>
          </motion.div>

          {/* Tips Section */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2 mb-3">
              <Star className="w-4 h-4" />
              Grading Tips
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {TIPS.map((tip, i) => (
                <motion.div
                  key={tip.title}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 + i * 0.03 }}
                  className="p-4 rounded-2xl bg-secondary/20 border border-border/20"
                >
                  <h4 className="font-semibold text-sm mb-1">{tip.title}</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">{tip.tip}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </main>
      </PageTransition>
      <BottomNav />
    </div>
  );
};

export default GradingGuide;
