import React from 'react';
import {
  Brain,
  HeartPulse,
  Compass,
  Wind,
  Zap,
  Eye,
  ShieldCheck,
  Activity,
  Feather,
  BatteryCharging,
  Smile,
  Sparkles,
} from 'lucide-react';

export interface MindfulBenefit {
  id: number;
  icon: (className?: string) => React.ReactNode;
  title: string;
  tagline: string;
  description: string;
}

export const MINDFUL_BENEFITS: MindfulBenefit[] = [
  {
    id: 1,
    icon: (cls = 'w-8 h-8 text-[#005f9e] dark:text-[#9dcaff]') => <Brain className={cls} />,
    title: 'Laser-Sharp Focus',
    tagline: 'Attention Span',
    description:
      'Stabilizing the bowl demands active, undivided presence, retraining the prefrontal cortex to resist digital distractions.',
  },
  {
    id: 2,
    icon: (cls = 'w-8 h-8 text-[#9a3412] dark:text-[#ffb4a0]') => <HeartPulse className={cls} />,
    title: 'Nervous System Calming',
    tagline: 'Stress Reduction',
    description:
      'Slow, controlled movements stimulate the vagus nerve, shifting your body from sympathetic fight-or-flight to restful parasympathetic calm.',
  },
  {
    id: 3,
    icon: (cls = 'w-8 h-8 text-[#007a6c] dark:text-[#66dbcb]') => <Compass className={cls} />,
    title: 'Proprioception & Balance',
    tagline: 'Body Awareness',
    description:
      'Real-time tilt feedback sharpens somatic sensory integration, improving spatial balance and fine motor coordination.',
  },
  {
    id: 4,
    icon: (cls = 'w-8 h-8 text-[#0284c7] dark:text-[#7dd3fc]') => <Wind className={cls} />,
    title: 'Natural Breath Regulation',
    tagline: 'Breathwork',
    description:
      'Keeping hands steady instinctively deepens diaphragmatic breathing, oxygenating the brain and stabilizing heart rate.',
  },
  {
    id: 5,
    icon: (cls = 'w-8 h-8 text-[#d97706] dark:text-[#fde047]') => <Zap className={cls} />,
    title: 'Effortless Flow State',
    tagline: 'Cognitive Flow',
    description:
      'The tight loop between physical motion and instant visual feedback rapidly pulls the mind into deep, immersive flow.',
  },
  {
    id: 6,
    icon: (cls = 'w-8 h-8 text-[#7c3aed] dark:text-[#c4b5fd]') => <Eye className={cls} />,
    title: 'Sensory Reset from Screen Fatigue',
    tagline: 'Mental Rest',
    description:
      'Replaces passive scrolling with active physical micro-engagement, relieving digital eye strain and cognitive overload.',
  },
  {
    id: 7,
    icon: (cls = 'w-8 h-8 text-[#059669] dark:text-[#6ee7b7]') => <ShieldCheck className={cls} />,
    title: 'Emotional Self-Regulation',
    tagline: 'Impulse Control',
    description:
      'Learning to recover smoothly from water wobbles builds emotional composure and resilience under micro-stress.',
  },
  {
    id: 8,
    icon: (cls = 'w-8 h-8 text-[#e11d48] dark:text-[#fda4af]') => <Activity className={cls} />,
    title: 'Postural Alignment',
    tagline: 'Physical Health',
    description:
      'Balancing a virtual bowl while walking naturally corrects slouched shoulders and encourages upright spine alignment.',
  },
  {
    id: 9,
    icon: (cls = 'w-8 h-8 text-[#0891b2] dark:text-[#67e8f9]') => <Feather className={cls} />,
    title: 'Active Zen Walking (Kinhin)',
    tagline: 'Somatic Meditation',
    description:
      'Inspired by Buddhist walking meditation, translating physical steps into grounding mindfulness in motion.',
  },
  {
    id: 10,
    icon: (cls = 'w-8 h-8 text-[#ca8a04] dark:text-[#fef08a]') => <BatteryCharging className={cls} />,
    title: 'Mental Energy Recharge',
    tagline: 'Cognitive Renewal',
    description:
      'A quick 30-second balancing break clears mental fog and restores cognitive agility between demanding tasks.',
  },
  {
    id: 11,
    icon: (cls = 'w-8 h-8 text-[#16a34a] dark:text-[#86efac]') => <Smile className={cls} />,
    title: 'Anxiety Release',
    tagline: 'Tension Relief',
    description:
      'Grounding physical awareness in the fingertips discharges physical tremors and nervous tension stored in the body.',
  },
  {
    id: 12,
    icon: (cls = 'w-8 h-8 text-[#9333ea] dark:text-[#d8b4fe]') => <Sparkles className={cls} />,
    title: 'Neuroplasticity & Motor Memory',
    tagline: 'Brain Plasticity',
    description:
      'Adapting to dynamic spill boundaries stimulates cerebellum pathways responsible for fine motor learning.',
  },
];
