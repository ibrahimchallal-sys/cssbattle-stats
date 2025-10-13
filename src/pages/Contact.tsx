import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Navbar from "@/components/Navbar";

export default function Contact() {
  const teamMembers = [
    {
      name: "ABDEL MONEIM MAGOURA",
      role: "Stagiaire",
      cohort: "DEVOWS 203"
    },
    {
      name: "IBRAHIM CHALLAL",
      role: "Stagiaire",
      cohort: "DEVOWS 203"
    },
    {
      name: "YOUNESS HLIBI",
      role: "Stagiaire",
      cohort: "DEVOWS 201"
    },
    {
      name: "HAMDI BOUMLIK",
      role: "FORMATEUR",
      cohort: ""
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-24">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">Contact</h1>
          <p className="text-lg text-foreground/80 max-w-2xl mx-auto">
            Meet our team members participating in the CSS Battle Championship
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {teamMembers.map((member, index) => (
            <Card 
              key={index} 
              className="bg-card/50 backdrop-blur-sm border-battle-purple/30 hover:scale-105 transition-transform hover:shadow-glow"
            >
              <CardHeader>
                <CardTitle className="text-xl text-foreground">{member.name}</CardTitle>
                <CardDescription className="text-battle-purple">
                  {member.role}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-foreground/80">
                  {member.cohort}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}