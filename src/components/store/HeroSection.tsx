import { Zap } from 'lucide-react';

export const HeroSection = () => {
  return (
    <section className='relative overflow-hidden border-b border-primary/20 bg-background h-[500px] flex items-center'>
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 bg-[url('https://image2url.com/images/1763923420548-12cd209b-53c0-4887-a945-fe400c239adf.png')] bg-cover bg-center opacity-50"></div>
      <div className='absolute inset-0 bg-gradient-to-r from-background via-background/50 to-transparent'></div>
      <div className='absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent'></div>

      {/* Grid Overlay */}
      <div className='absolute inset-0 bg-[linear-gradient(to_right,#1a1a1a_1px,transparent_1px),linear-gradient(to_bottom,#1a1a1a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-20' />

      {/* Content */}
      <div className='container relative z-20'>
        <div className='max-w-3xl space-y-6'>
          <div className='inline-flex items-center gap-2 border border-primary/30 bg-primary/5 px-4 py-1.5 text-sm font-bold uppercase tracking-[0.2em] text-primary backdrop-blur-sm'>
            <Zap className='h-3 w-3 fill-primary' />
            NEW USERS PROMO
          </div>

          <h1 className='text-6xl md:text-8xl font-black uppercase italic leading-[0.9] tracking-tighter text-foreground drop-shadow-2xl'>
            Get 20% off
            <br />
            <span className='text-transparent bg-clip-text bg-gradient-to-r from-primary via-white to-primary animate-pulse'>
              your first purchase
            </span>
          </h1>

          <p className='max-w-xl text-lg text-muted-foreground font-medium border-l-2 border-primary/50 pl-6 leading-relaxed'>
            *Promotion valid for selected products only.
          </p>
        </div>
      </div>
    </section>
  );
};
