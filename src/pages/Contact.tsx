import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Navbar from "@/components/Navbar";
import { Mail } from "lucide-react";

export default function Contact() {
  const teamMembers = [
    {
      name: "ABDEL MONEIM MAGOURA",
      role: "Stagiaire",
      cohort: "DEVOWS 203",
      email: "mazgouraabdalmounim@gmail.com"
    },
    {
      name: "IBRAHIM CHALLAL",
      role: "Stagiaire",
      cohort: "DEVOWS 203",
      email: "i.challal9970@gmail.com"
    },
    {
      name: "YOUNESS HLIBI",
      role: "Stagiaire",
      cohort: "DEVOWS 201",
      email:"X"
    },
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
              className="bg-card/50 backdrop-blur-sm border-battle-purple/30 hover:scale-105 transition-transform hover:shadow-glow h-full flex flex-col"
            >
              <CardHeader className="flex-grow">
                <CardTitle className="text-xl text-foreground text-center">{member.name}</CardTitle>
                <CardDescription className="text-battle-purple text-center">
                  {member.role}
                </CardDescription>
              </CardHeader>
              <CardContent className="mt-auto">
                <div className="flex flex-col items-center justify-center h-full">
                  <p className="text-foreground/80 mb-2 text-center">
                    {member.cohort}
                  </p>
                  {member.email && (
                    <div className="flex items-center text-sm text-foreground/80">
                      <Mail className="w-4 h-4 mr-2" />
                      <a 
                        href={`mailto:${member.email}`} 
                        className="hover:text-battle-purple transition-colors text-center"
                      >
                        {member.email}
                      </a>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}