import React, { useState, useEffect, useCallback } from 'react';
import { useWevids } from '../../context/WevidsContext';
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  Plus, 
  Image as ImageIcon, 
  Video as VideoIcon, 
  Sparkles,
  CheckCircle2,
  Film,
  Radio,
  Trash2,
  Send,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { RichCommentInput } from '../comments/RichCommentInput';
import { CreatePostModal } from './CreatePostModal';
import { sounds } from '../../lib/soundFx';
import { supabase, checkContentModeration } from '../../lib/supabase';
import { PostItem } from '../../types/wevids';
import { toast } from 'sonner';

// Robust helper to extract a readable error message from any Supabase error shape
const getErrorMessage = (error: any): string => {
  if (!error) return 'Unknown error';
  if (typeof error === 'string') return error;
  if (typeof error === 'object') {
    if (typeof error.message === 'string') return error.message;
    if (typeof error.hint === 'string') return error.hint;
    if (typeof error.error_description === 'string') return error.error_description;

    // Handle nested message objects
    if (typeof error.message === 'object' && error.message !== null) {
      const nested = error.message;
      if (typeof nested.message === 'string') return nested.message;
      if (typeof nested.hint === 'string') return nested.hint;
      return JSON.stringify(nested);
    }

    try {
      const str = JSON.stringify(error);
      if (str && str !== '{}') return str;
    } catch {
      // ignore
    }
  }
  const str = String(error);
  return str !== '[object Object]' ? str : 'Unknown database error';
};

export const DualFeedView: React.FC = () => {
  // ... (rest of the component remains the same, as already provided)