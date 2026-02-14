import { motion, AnimatePresence } from "framer-motion";
import { Award, Shield, Hash, ExternalLink } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GRADING_SCALES, getUniqueGradeValues, getGradeLabel } from "@/lib/gradingScales";

interface GradingCompany {
  value: string;
  label: string;
  fullName: string;
  color: string;
  logo?: string;
}

const GRADING_COMPANIES: GradingCompany[] = [
  { value: "psa", label: "PSA", fullName: "Professional Sports Authenticator", color: "bg-red-500" },
  { value: "cgc", label: "CGC", fullName: "Certified Guaranty Company", color: "bg-purple-500" },
  { value: "bgs", label: "BGS", fullName: "Beckett Grading Services", color: "bg-blue-500" },
  { value: "sgc", label: "SGC", fullName: "Sportscard Guaranty Company", color: "bg-navy-500" },
  { value: "ace", label: "ACE", fullName: "ACE Grading", color: "bg-orange-500" },
  { value: "tag", label: "TAG", fullName: "TAG Grading", color: "bg-cyan-500" },
];

interface GradingPanelProps {
  isGraded: boolean;
  onGradedChange: (isGraded: boolean) => void;
  company: string;
  onCompanyChange: (company: string) => void;
  grade: string;
  onGradeChange: (grade: string) => void;
  certNumber: string;
  onCertNumberChange: (certNumber: string) => void;
}

export const GradingPanel = ({
  isGraded,
  onGradedChange,
  company,
  onCompanyChange,
  grade,
  onGradeChange,
  certNumber,
  onCertNumberChange,
}: GradingPanelProps) => {
  const selectedCompany = GRADING_COMPANIES.find(c => c.value === company);
  const gradeValues = company ? getUniqueGradeValues(company) : [];
  const gradeLabel = company && grade ? getGradeLabel(company, parseFloat(grade)) : "";

  const handleVerifyCert = () => {
    if (!certNumber || !company) return;
    
    let url = "";
    switch (company) {
      case "psa":
        url = `https://www.psacard.com/cert/${certNumber}`;
        break;
      case "cgc":
        url = `https://www.cgccomics.com/certlookup/?CertNumber=${certNumber}`;
        break;
      case "bgs":
        url = `https://www.beckett.com/grading/card-lookup?number=${certNumber}`;
        break;
      case "sgc":
        url = `https://www.sgccardregistry.com/cert/${certNumber}`;
        break;
      default:
        return;
    }
    
    window.open(url, "_blank");
  };

  return (
    <div className="space-y-4">
      {/* Graded Toggle */}
      <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/30 border border-border/50">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isGraded ? 'bg-primary' : 'bg-secondary'}`}>
            <Award className={`w-5 h-5 ${isGraded ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
          </div>
          <div>
            <p className="font-medium text-foreground">Graded Card</p>
            <p className="text-xs text-muted-foreground">Card is professionally graded and slabbed</p>
          </div>
        </div>
        <Switch
          checked={isGraded}
          onCheckedChange={onGradedChange}
        />
      </div>

      {/* Grading Details (shown when graded) */}
      <AnimatePresence>
        {isGraded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-4 overflow-hidden"
          >
            {/* Grading Company Selection */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Grading Company</Label>
              <div className="grid grid-cols-3 gap-2">
                {GRADING_COMPANIES.map((comp) => (
                  <motion.button
                    key={comp.value}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onCompanyChange(comp.value)}
                    className={`
                      relative p-3 rounded-xl border-2 transition-all text-center
                      ${company === comp.value
                        ? `border-current ${comp.color.replace('bg-', 'text-')}`
                        : 'border-border/50 hover:border-border'
                      }
                    `}
                  >
                    <div className={`w-8 h-8 mx-auto rounded-lg ${comp.color} flex items-center justify-center text-white font-bold text-xs mb-1`}>
                      {comp.label}
                    </div>
                    <p className="text-xs font-medium text-muted-foreground">{comp.label}</p>
                    
                    {company === comp.value && (
                      <motion.div
                        layoutId="company-check"
                        className={`absolute -top-1 -right-1 w-4 h-4 rounded-full ${comp.color} flex items-center justify-center`}
                      >
                        <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </motion.div>
                    )}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Grade Selection */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="grade" className="text-sm font-medium">Grade</Label>
                <Select value={grade} onValueChange={onGradeChange}>
                  <SelectTrigger id="grade" className="bg-secondary/30">
                    <SelectValue placeholder="Select grade" />
                  </SelectTrigger>
                  <SelectContent>
                    {gradeValues.map((gradeVal) => (
                      <SelectItem key={gradeVal} value={gradeVal.toString()}>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{gradeVal}</span>
                          <span className="text-muted-foreground">
                            - {getGradeLabel(company, gradeVal)}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                {grade && gradeLabel && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Shield className="h-3 w-3" />
                    {selectedCompany?.label} {grade} - {gradeLabel}
                  </p>
                )}
              </div>

              {/* Certification Number */}
              <div className="space-y-2">
                <Label htmlFor="certNumber" className="text-sm font-medium">
                  Cert Number
                </Label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="certNumber"
                    placeholder="e.g., 12345678"
                    value={certNumber}
                    onChange={(e) => onCertNumberChange(e.target.value)}
                    className="pl-9 pr-10 bg-secondary/30"
                  />
                  {certNumber && ["psa", "cgc", "bgs", "sgc"].includes(company) && (
                    <button
                      onClick={handleVerifyCert}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-secondary transition-colors"
                      title="Verify certification"
                    >
                      <ExternalLink className="h-4 w-4 text-primary" />
                    </button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Found on the slab label
                </p>
              </div>
            </div>

            {/* Graded Card Preview */}
            {company && grade && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-4 rounded-xl bg-gradient-to-br from-secondary/50 to-secondary/20 border border-border/50"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl ${selectedCompany?.color || 'bg-secondary'} flex items-center justify-center text-white font-bold`}>
                    {grade}
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">
                      {selectedCompany?.label} {grade}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {gradeLabel}
                    </p>
                    {certNumber && (
                      <p className="text-xs text-muted-foreground">
                        Cert #{certNumber}
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GradingPanel;
