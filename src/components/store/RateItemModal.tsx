/**
 * RateItemModal Component
 * Allows users to create attestations about items
 */

import { useState } from 'react';
import {
  ThumbsUp,
  ThumbsDown,
  DollarSign,
  TrendingUp,
  MessageSquare,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAttestation } from '@/hooks/useAttestation';
import { PREDICATES } from '@/services/intuition';

interface RateItemModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemId: string;
  itemName: string;
  onSuccess?: () => void;
}

export const RateItemModal = ({
  open,
  onOpenChange,
  itemId,
  itemName,
  onSuccess,
}: RateItemModalProps) => {
  const { attestItem, isProcessing } = useAttestation();
  const [selectedRating, setSelectedRating] = useState<
    keyof typeof PREDICATES | null
  >(null);
  const [stakeAmount, setStakeAmount] = useState('0.01');
  const [comment, setComment] = useState('');

  const ratings = [
    {
      key: 'IS_GREAT' as keyof typeof PREDICATES,
      label: 'Great Item',
      icon: ThumbsUp,
      color: 'text-green-500',
      description: 'This item is awesome!',
    },
    {
      key: 'IS_HIGH_QUALITY' as keyof typeof PREDICATES,
      label: 'High Quality',
      icon: TrendingUp,
      color: 'text-blue-500',
      description: 'Well designed and valuable',
    },
    {
      key: 'IS_FAIR_PRICE' as keyof typeof PREDICATES,
      label: 'Fair Price',
      icon: DollarSign,
      color: 'text-yellow-500',
      description: 'Good value for money',
    },
    {
      key: 'IS_OVERPRICED' as keyof typeof PREDICATES,
      label: 'Overpriced',
      icon: DollarSign,
      color: 'text-orange-500',
      description: 'Too expensive',
    },
    {
      key: 'IS_BAD' as keyof typeof PREDICATES,
      label: 'Bad Item',
      icon: ThumbsDown,
      color: 'text-red-500',
      description: 'Not worth it',
    },
  ];

  const handleSubmit = async () => {
    if (!selectedRating) return;

    const stakeInWei = BigInt(Math.floor(parseFloat(stakeAmount) * 10 ** 18));

    const result = await attestItem({
      itemId,
      predicate: selectedRating,
      stakeAmount: stakeInWei,
      comment: comment.trim() || undefined, // Pass comment if provided
    });

    if (result.success) {
      onOpenChange(false);
      setSelectedRating(null);
      setStakeAmount('0.01');
      setComment('');
      onSuccess?.();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[500px] max-h-[85vh] flex flex-col'>
        <DialogHeader>
          <DialogTitle>Rate: {itemName}</DialogTitle>
          <DialogDescription>
            Stake $TRUST to share your opinion about this item. Your rating will
            help the community.
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-6 py-4 overflow-y-auto flex-1'>
          {/* Rating Selection */}
          <div className='space-y-3'>
            <Label>Select your rating</Label>
            <div className='grid gap-2'>
              {ratings.map((rating) => {
                const Icon = rating.icon;
                const isSelected = selectedRating === rating.key;

                return (
                  <button
                    key={rating.key}
                    onClick={() => setSelectedRating(rating.key)}
                    className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                      isSelected
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <Icon className={`h-5 w-5 ${rating.color}`} />
                    <div className='flex-1 text-left'>
                      <div className='font-semibold'>{rating.label}</div>
                      <div className='text-xs text-muted-foreground'>
                        {rating.description}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Stake Amount */}
          <div className='space-y-2'>
            <Label htmlFor='stake'>Stake Amount ($TRUST)</Label>
            <Input
              id='stake'
              type='number'
              step='0.01'
              min='0.01'
              max='10'
              value={stakeAmount}
              onChange={(e) => setStakeAmount(e.target.value)}
              placeholder='0.01'
            />
            <p className='text-xs text-muted-foreground'>
              Higher stakes show stronger conviction. Min: 0.01 $TRUST
            </p>
          </div>

          {/* Comment/Review */}
          <div className='space-y-2'>
            <Label htmlFor='comment' className='flex items-center gap-2'>
              <MessageSquare className='h-4 w-4' />
              Add Review (Optional)
            </Label>
            <Textarea
              id='comment'
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder='Share your thoughts about this item...'
              maxLength={500}
              rows={3}
              className='resize-none'
            />
            <p className='text-xs text-muted-foreground'>
              {comment.length}/500 characters • Your review helps others make
              informed decisions
            </p>
          </div>

          {/* Info Box */}
          <div className='bg-secondary/30 p-3 rounded-lg border border-border/50'>
            <p className='text-sm text-muted-foreground'>
              💡 Your staked $TRUST earns rewards when others agree with your
              rating. Be among the first 10 raters for bonus rewards!
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className='flex gap-2'>
          <Button
            variant='outline'
            onClick={() => onOpenChange(false)}
            className='flex-1'
            disabled={isProcessing}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            className='flex-1'
            disabled={!selectedRating || isProcessing}
          >
            {isProcessing ? 'Processing...' : `Stake ${stakeAmount} $TRUST`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
