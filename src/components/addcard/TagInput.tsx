import { useState, useRef, KeyboardEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Tag, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const SUGGESTED_TAGS = [
  "Rare Find",
  "Investment",
  "For Sale",
  "Trade Bait",
  "Personal Collection",
  "Grading Candidate",
  "Alt Art",
  "Full Art",
  "First Edition",
  "Shadowless",
  "Error Card",
];

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  maxTags?: number;
}

export const TagInput = ({
  tags,
  onChange,
  maxTags = 10,
}: TagInputProps) => {
  const [inputValue, setInputValue] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const addTag = (tag: string) => {
    const trimmedTag = tag.trim();
    if (
      trimmedTag &&
      !tags.includes(trimmedTag) &&
      tags.length < maxTags
    ) {
      onChange([...tags, trimmedTag]);
      setInputValue("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    onChange(tags.filter(tag => tag !== tagToRemove));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(inputValue);
    } else if (e.key === "Backspace" && !inputValue && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    }
  };

  const filteredSuggestions = SUGGESTED_TAGS.filter(
    tag => 
      !tags.includes(tag) &&
      tag.toLowerCase().includes(inputValue.toLowerCase())
  );

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground flex items-center gap-2">
        <Tag className="h-4 w-4" />
        Tags
      </label>

      {/* Tags Container */}
      <div
        className="flex flex-wrap gap-2 p-3 rounded-xl bg-secondary/30 border border-border/50 min-h-[52px] cursor-text"
        onClick={() => inputRef.current?.focus()}
      >
        <AnimatePresence>
          {tags.map((tag) => (
            <motion.div
              key={tag}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
            >
              <Badge
                variant="secondary"
                className="gap-1 pr-1 hover:bg-secondary"
              >
                {tag}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeTag(tag);
                  }}
                  className="p-0.5 rounded-full hover:bg-destructive/20 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            </motion.div>
          ))}
        </AnimatePresence>

        {tags.length < maxTags && (
          <div className="relative flex-1 min-w-[120px]">
            <Input
              ref={inputRef}
              type="text"
              placeholder={tags.length === 0 ? "Add tags..." : ""}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
              className="border-0 bg-transparent p-0 h-6 focus-visible:ring-0 placeholder:text-muted-foreground"
            />
          </div>
        )}
      </div>

      {/* Suggestions */}
      <AnimatePresence>
        {showSuggestions && filteredSuggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-wrap gap-2"
          >
            <span className="text-xs text-muted-foreground w-full">
              Suggestions:
            </span>
            {filteredSuggestions.slice(0, 6).map((suggestion) => (
              <Badge
                key={suggestion}
                variant="outline"
                className="cursor-pointer hover:bg-secondary/50 transition-colors"
                onClick={() => addTag(suggestion)}
              >
                <Plus className="h-3 w-3 mr-1" />
                {suggestion}
              </Badge>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Helper Text */}
      <p className="text-xs text-muted-foreground">
        Press Enter or comma to add a tag. {tags.length}/{maxTags} tags used.
      </p>
    </div>
  );
};

export default TagInput;
