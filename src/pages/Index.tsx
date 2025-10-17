import { Card } from "@/components/ui/card";
import FloatingShape from "@/components/FloatingShape";
import CodeBlock from "@/components/CodeBlock";
import Navbar from "@/components/Navbar";
import { Code2, Trophy, Users, Zap, Calendar } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useAdmin } from "@/contexts/AdminContext";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const { user } = useAuth();
  const { isAdmin } = useAdmin();
  const [playerCount, setPlayerCount] = useState<number | null>(null);
  const [daysLeftInMonth, setDaysLeftInMonth] = useState<number>(0);
  
  const codeExample = [
    ".battle {",
    "  display: flex;",
    "  background: linear-gradient(135deg, #A020F0, #E796E7);",
    "  transform: scale(1.1);",
    "}"
  ];

  useEffect(() => {
    // Simple timeout to ensure the DOM is fully loaded
    const timer = setTimeout(() => {
      fetchPlayerCount();
      calculateDaysLeftInMonth();
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  const fetchPlayerCount = async () => {
    try {
      const { count, error } = await supabase
        .from('players')
        .select('*', { count: 'exact', head: true });
      
      if (!error && count !== null) {
        setPlayerCount(count);
      } else {
        setPlayerCount(1000); // Default fallback value
      }
    } catch (error) {
      setPlayerCount(1000); // Default fallback value
    }
  };

  const calculateDaysLeftInMonth = () => {
    const now = new Date();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const daysLeft = endOfMonth.getDate() - now.getDate() + 1;
    setDaysLeftInMonth(daysLeft);
  };

  return (
    <main className="min-h-screen bg-background overflow-hidden relative font-heading">
      <Navbar />
      {/* Animated Background Shapes */}
      <FloatingShape color="purple" size={300} top="15%" left="5%" delay={0} />
      <FloatingShape color="pink" size={200} top="65%" left="80%" delay={1} rotation />
      <FloatingShape color="yellow" size={150} top="35%" left="75%" delay={0.5} />
      <FloatingShape color="purple" size={100} top="85%" left="15%" delay={1.5} />

      {/* Hero Section */}
      <section className="relative z-10 container mx-auto px-4 py-24 md:py-32">
        <div className="text-center">
          {/* Event Tag */}
          <div className="inline-flex items-center gap-2 bg-gradient-primary text-foreground px-4 py-2 rounded-full mb-6 md:mb-8 shadow-glow">
            <Zap className="w-4 h-4" />
            <span className="text-sm font-semibold uppercase tracking-wider">Live Competition</span>
          </div>

          {/* Main Title */}
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold mb-6 md:mb-8 leading-tight">
            <span className="block text-foreground">CSS</span>
            <span className="block bg-gradient-primary bg-clip-text text-transparent">
              BATTLE
            </span>
            <span className="block text-battle-accent">CHAMPIONSHIP</span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg md:text-xl lg:text-2xl text-foreground/80 mb-8 md:mb-12 max-w-3xl mx-auto">
            Compete against developers worldwide. Write the cleanest code. Claim victory.
          </p>

          {/* Code Example */}
          <div className="max-w-2xl mx-auto mb-12 md:mb-16">
            <CodeBlock lines={codeExample} className="animate-float" />
          </div>
        </div>
      </section>

      {/* Info Cards */}
      <section className="relative z-10 container mx-auto px-4 pb-12 md:pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          <Card className="bg-card/50 backdrop-blur-sm border-battle-pink/30 p-6 md:p-8 hover:scale-105 transition-transform hover:shadow-glow-pink">
            <div className="w-12 h-12 md:w-16 md:h-16 bg-battle-pink rounded-lg flex items-center justify-center mb-4 shadow-glow-pink">
              <Users className="w-6 h-6 md:w-8 md:h-8 text-background" />
            </div>
            <h3 className="text-xl md:text-2xl font-bold mb-2 text-foreground">Global Players</h3>
            <p className="text-2xl md:text-3xl font-bold text-battle-pink mb-2">
              {playerCount !== null ? playerCount.toLocaleString() : '1,000+'}
            </p>
            <p className="text-foreground/70">Developers competing</p>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm border-battle-accent/30 p-6 md:p-8 hover:scale-105 transition-transform hover:shadow-glow-accent">
            <div className="w-12 h-12 md:w-16 md:h-16 bg-battle-accent rounded-lg flex items-center justify-center mb-4 shadow-glow-accent">
              <Code2 className="w-6 h-6 md:w-8 md:h-8 text-background" />
            </div>
            <h3 className="text-xl md:text-2xl font-bold mb-2 text-foreground">Challenges</h3>
            <p className="text-2xl md:text-3xl font-bold text-battle-accent mb-2">50+</p>
            <p className="text-foreground/70">Unique CSS battles</p>
          </Card>
        </div>

        {/* Daily Challenge Card */}
        <Card className="mt-6 bg-card/50 backdrop-blur-sm border-battle-purple/30 p-6 md:p-8 hover:scale-105 transition-transform hover:shadow-glow">
          <div className="flex flex-col items-center text-center">
            <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-primary rounded-lg flex items-center justify-center mb-4 shadow-glow">
              <Trophy className="w-6 h-6 md:w-8 md:h-8 text-foreground" />
            </div>
            <h3 className="text-xl md:text-2xl font-bold mb-2 text-foreground">Daily Challenge</h3>
            <p className="text-foreground/70 mb-4">Test your skills with today's CSS battle</p>
            <a 
              href="https://cssbattle.dev/daily" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center bg-gradient-primary text-foreground px-6 py-3 rounded-lg font-semibold hover:scale-105 transition-transform shadow-glow"
            >
              Take on the Daily Challenge
            </a>
          </div>
        </Card>
      </section>

      {/* Event Details */}
      <section className="relative z-10 container mx-auto px-4 pb-12 md:pb-20">
        <Card className="bg-gradient-primary p-8 md:p-12 text-center shadow-glow max-w-4xl mx-auto">
          <div className="flex flex-wrap gap-4 justify-center text-sm md:text-base">
            <div className="bg-background/20 backdrop-blur-sm px-4 md:px-6 py-2 md:py-3 rounded-lg">
              <span className="text-foreground/80">Online Event</span>
            </div>
            <div className="bg-background/20 backdrop-blur-sm px-4 md:px-6 py-2 md:py-3 rounded-lg">
              <span className="text-foreground/80">All Skill Levels</span>
            </div>
            <div className="bg-background/20 backdrop-blur-sm px-4 md:px-6 py-2 md:py-3 rounded-lg">
              <span className="text-foreground/80">Live Leaderboard</span>
            </div>
          </div>
          
          {/* Monthly Counter Card */}
          <Card className="mt-8 bg-background/30 backdrop-blur-sm border-foreground/20 p-6">
            <div className="flex items-center justify-center gap-3 mb-2">
              <Calendar className="w-5 h-5 text-foreground" />
              <h3 className="text-lg md:text-xl font-bold text-foreground">Days Left This Month</h3>
            </div>
            <p className="text-2xl md:text-3xl font-bold text-battle-accent">
              {daysLeftInMonth}
            </p>
          </Card>
        </Card>
      </section>
    </main>
  );
};

export default Index;