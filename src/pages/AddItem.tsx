import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Upload, X, AlertTriangle, Trophy, ChevronDown, Star } from "lucide-react";
import Navbar from "@/components/Navbar";
import { useInventoryDb } from "@/hooks/useInventoryDb";
import { toast } from "sonner";

const AddItem = () => {
  const navigate = useNavigate();
  const { addItem, uploadCardImage, checkForDuplicates } = useInventoryDb();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState<{ exists: boolean; quantity: number } | null>(null);
  const [showSportsFields, setShowSportsFields] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    set_name: "",
    category: "",
    purchase_price: "",
    sale_price: "",
    quantity: "",
    condition: "near-mint",
    grading_company: "raw",
    grade: "",
    platform_sold: "",
    notes: "",
    // Sports card fields
    player: "",
    team: "",
    sport: "",
    year: "",
    brand: "",
    rookie: false,
  });

  // Check for duplicates when relevant fields change
  const checkDuplicates = useCallback(async () => {
    if (!formData.name || !formData.set_name) {
      setDuplicateWarning(null);
      return;
    }

    const result = await checkForDuplicates(
      formData.name,
      formData.set_name,
      formData.grading_company,
      formData.grade || null
    );

    if (result.exists) {
      setDuplicateWarning({ exists: true, quantity: result.quantity });
    } else {
      setDuplicateWarning(null);
    }
  }, [formData.name, formData.set_name, formData.grading_company, formData.grade, checkForDuplicates]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      checkDuplicates();
    }, 500); // Debounce 500ms

    return () => clearTimeout(timeoutId);
  }, [checkDuplicates]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.set_name || !formData.purchase_price || !formData.quantity) {
      toast.error("Please fill in all required fields");
      return;
    }

    setUploading(true);

    try {
      let imageUrl = "";
      if (imageFile) {
        imageUrl = await uploadCardImage(imageFile);
      }

      await addItem({
        name: formData.name,
        set_name: formData.set_name,
        category: formData.category || null,
        purchase_price: parseFloat(formData.purchase_price),
        sale_price: formData.sale_price ? parseFloat(formData.sale_price) : null,
        quantity: parseInt(formData.quantity),
        condition: formData.condition as any,
        grading_company: formData.grading_company as any,
        grade: formData.grade || null,
        platform_sold: formData.platform_sold || null,
        card_image_url: imageUrl || null,
        notes: formData.notes || null,
        // Sports card fields
        player: formData.player || null,
        team: formData.team || null,
        sport: formData.sport || null,
        year: formData.year ? parseInt(formData.year) : null,
        brand: formData.brand || null,
        rookie: formData.rookie,
      } as any);

      navigate("/inventory");
    } catch (error) {
      console.error("Error adding item:", error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pt-safe">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          className="mb-4 gap-2"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>

        <Card className="max-w-3xl mx-auto border-border/50 bg-gradient-vault">
          <CardHeader>
            <CardTitle className="text-2xl text-primary">Add New Card</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Card Image Upload */}
              <div className="space-y-2">
                <Label>Card Image</Label>
                {imagePreview ? (
                  <div className="relative w-full max-w-xs mx-auto">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="rounded-lg border border-border/50 w-full"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={() => {
                        setImageFile(null);
                        setImagePreview("");
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-border/50 border-dashed rounded-lg cursor-pointer hover:border-primary/50 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="h-8 w-8 mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        Tap or drag to upload image
                      </p>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleImageSelect}
                    />
                  </label>
                )}
              </div>

              {/* Duplicate Warning */}
              {duplicateWarning?.exists && (
                <Alert className="border-amber-500/50 bg-amber-500/10">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  <AlertDescription className="text-amber-600 dark:text-amber-400">
                    You already own <strong>{duplicateWarning.quantity}</strong> of this card with the same grading.
                    Adding more will update the existing entry.
                  </AlertDescription>
                </Alert>
              )}

              {/* Basic Info */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">
                    Card Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="name"
                    placeholder="e.g., Charizard VMAX"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="set_name">
                    Set Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="set_name"
                    placeholder="e.g., Brilliant Stars"
                    value={formData.set_name}
                    onChange={(e) =>
                      setFormData({ ...formData, set_name: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  placeholder="e.g., Ultra Rare, Secret Rare"
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                />
              </div>

              {/* Grading Info */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="grading_company">Grading Status</Label>
                  <Select
                    value={formData.grading_company}
                    onValueChange={(value) =>
                      setFormData({ ...formData, grading_company: value })
                    }
                  >
                    <SelectTrigger id="grading_company">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="raw">Raw (Ungraded)</SelectItem>
                      <SelectItem value="psa">PSA</SelectItem>
                      <SelectItem value="bgs">BGS / Beckett</SelectItem>
                      <SelectItem value="cgc">CGC</SelectItem>
                      <SelectItem value="sgc">SGC</SelectItem>
                      <SelectItem value="tag">TAG</SelectItem>
                      <SelectItem value="ace">ACE</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.grading_company !== "raw" && (
                  <div className="space-y-2">
                    <Label htmlFor="grade">Grade</Label>
                    <Input
                      id="grade"
                      placeholder="e.g., 10, 9.5"
                      value={formData.grade}
                      onChange={(e) =>
                        setFormData({ ...formData, grade: e.target.value })
                      }
                    />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="condition">Condition</Label>
                <Select
                  value={formData.condition}
                  onValueChange={(value) =>
                    setFormData({ ...formData, condition: value })
                  }
                >
                  <SelectTrigger id="condition">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mint">Mint</SelectItem>
                    <SelectItem value="near-mint">Near Mint</SelectItem>
                    <SelectItem value="lightly-played">Lightly Played</SelectItem>
                    <SelectItem value="moderately-played">Moderately Played</SelectItem>
                    <SelectItem value="heavily-played">Heavily Played</SelectItem>
                    <SelectItem value="damaged">Damaged</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Sports Card Section - Collapsible */}
              <div className="space-y-4">
                <button
                  type="button"
                  onClick={() => setShowSportsFields(!showSportsFields)}
                  className="flex items-center justify-between w-full p-4 glass-card rounded-xl hover:bg-secondary/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-chart-4/15 flex items-center justify-center">
                      <Trophy className="w-5 h-5 text-chart-4" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium">Sports Card Details</p>
                      <p className="text-xs text-muted-foreground">Add player, team, and year info</p>
                    </div>
                  </div>
                  <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform ${showSportsFields ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {showSportsFields && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-4 overflow-hidden"
                    >
                      {/* Player & Team */}
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="player">Player Name</Label>
                          <Input
                            id="player"
                            placeholder="e.g., LeBron James"
                            value={formData.player}
                            onChange={(e) =>
                              setFormData({ ...formData, player: e.target.value })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="team">Team</Label>
                          <Input
                            id="team"
                            placeholder="e.g., Los Angeles Lakers"
                            value={formData.team}
                            onChange={(e) =>
                              setFormData({ ...formData, team: e.target.value })
                            }
                          />
                        </div>
                      </div>

                      {/* Sport & Year */}
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="sport">Sport</Label>
                          <Select
                            value={formData.sport}
                            onValueChange={(value) =>
                              setFormData({ ...formData, sport: value })
                            }
                          >
                            <SelectTrigger id="sport">
                              <SelectValue placeholder="Select sport" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="baseball">Baseball</SelectItem>
                              <SelectItem value="basketball">Basketball</SelectItem>
                              <SelectItem value="football">Football</SelectItem>
                              <SelectItem value="hockey">Hockey</SelectItem>
                              <SelectItem value="soccer">Soccer</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="year">Card Year</Label>
                          <Input
                            id="year"
                            type="number"
                            placeholder="e.g., 2023"
                            value={formData.year}
                            onChange={(e) =>
                              setFormData({ ...formData, year: e.target.value })
                            }
                          />
                        </div>
                      </div>

                      {/* Brand */}
                      <div className="space-y-2">
                        <Label htmlFor="brand">Brand / Manufacturer</Label>
                        <Select
                          value={formData.brand}
                          onValueChange={(value) =>
                            setFormData({ ...formData, brand: value })
                          }
                        >
                          <SelectTrigger id="brand">
                            <SelectValue placeholder="Select brand" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="topps">Topps</SelectItem>
                            <SelectItem value="panini">Panini</SelectItem>
                            <SelectItem value="upper-deck">Upper Deck</SelectItem>
                            <SelectItem value="bowman">Bowman</SelectItem>
                            <SelectItem value="donruss">Donruss</SelectItem>
                            <SelectItem value="prizm">Prizm</SelectItem>
                            <SelectItem value="select">Select</SelectItem>
                            <SelectItem value="fleer">Fleer</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Rookie Card Toggle */}
                      <div className="flex items-center justify-between p-4 glass-card rounded-xl">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-warning/15 flex items-center justify-center">
                            <Star className="w-5 h-5 text-warning" />
                          </div>
                          <div>
                            <p className="font-medium">Rookie Card</p>
                            <p className="text-xs text-muted-foreground">First year card - highly collectible</p>
                          </div>
                        </div>
                        <Switch
                          checked={formData.rookie}
                          onCheckedChange={(checked) => setFormData({ ...formData, rookie: checked })}
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Pricing */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="purchase_price">
                    Purchase Price ($) <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="purchase_price"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.purchase_price}
                    onChange={(e) =>
                      setFormData({ ...formData, purchase_price: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sale_price">Sale Price ($)</Label>
                  <Input
                    id="sale_price"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.sale_price}
                    onChange={(e) =>
                      setFormData({ ...formData, sale_price: e.target.value })
                    }
                  />
                </div>
              </div>

              {/* Quantity & Platform */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="quantity">
                    Quantity <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="quantity"
                    type="number"
                    placeholder="1"
                    value={formData.quantity}
                    onChange={(e) =>
                      setFormData({ ...formData, quantity: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="platform_sold">Platform Sold</Label>
                  <Select
                    value={formData.platform_sold}
                    onValueChange={(value) =>
                      setFormData({ ...formData, platform_sold: value })
                    }
                  >
                    <SelectTrigger id="platform_sold">
                      <SelectValue placeholder="Select platform" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ebay">eBay</SelectItem>
                      <SelectItem value="whatnot">Whatnot</SelectItem>
                      <SelectItem value="tcgplayer">TCGPlayer</SelectItem>
                      <SelectItem value="facebook">Facebook Marketplace</SelectItem>
                      <SelectItem value="instagram">Instagram</SelectItem>
                      <SelectItem value="local">Local Sale</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Add any additional notes or tags..."
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  rows={3}
                />
              </div>

              <div className="flex gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 border-primary/20 hover:border-primary/40"
                  onClick={() => navigate(-1)}
                  disabled={uploading}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="flex-1 shadow-gold hover:shadow-gold-strong"
                  disabled={uploading}
                >
                  {uploading ? "Adding Card..." : "Add Card"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default AddItem;
