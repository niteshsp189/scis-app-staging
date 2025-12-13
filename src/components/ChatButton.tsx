
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MessageSquare, X, Send, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface Employee {
  id: string;
  name: string;
  role: string;
  status: 'online' | 'offline' | 'busy';
}

interface Message {
  id: number;
  senderId: string;
  senderName: string;
  message: string;
  time: string;
  isMe: boolean;
}

export function ChatButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<string>("");
  const [newMessage, setNewMessage] = useState("");
  
  const employees: Employee[] = [
    { id: "1", name: "John Smith", role: "Sales Manager", status: "online" },
    { id: "2", name: "Sarah Wilson", role: "Agent", status: "online" },
    { id: "3", name: "Mike Johnson", role: "Agent", status: "busy" },
    { id: "4", name: "Lisa Davis", role: "Support", status: "offline" },
  ];

  const [messages, setMessages] = useState<Message[]>([
    { id: 1, senderId: "1", senderName: "John Smith", message: "Hi team, any updates on the Johnson account?", time: "2:30 PM", isMe: false },
    { id: 2, senderId: "current", senderName: "You", message: "Working on it, will update soon!", time: "2:32 PM", isMe: true },
  ]);

  const unreadCount = 2;

  const handleSendMessage = () => {
    if (newMessage.trim() && selectedEmployee) {
      const employee = employees.find(emp => emp.id === selectedEmployee);
      setMessages(prev => [...prev, {
        id: Date.now(),
        senderId: "current",
        senderName: "You",
        message: newMessage,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isMe: true
      }]);
      setNewMessage("");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'busy': return 'bg-yellow-500';
      case 'offline': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <>
      {/* <Button
        variant="outline"
        size="icon"
        onClick={() => setIsOpen(true)}
        className="relative"
      >
        <MessageSquare className="h-4 w-4" />
        {unreadCount > 0 && (
          <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs bg-blue-500">
            {unreadCount}
          </Badge>
        )}
      </Button> */}

      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md h-[500px]">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5" />
                Employee Chat
              </CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="p-0 flex flex-col h-[420px]">
              <div className="p-4 border-b">
                <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select employee to chat with" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((employee) => (
                      <SelectItem key={employee.id} value={employee.id}>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${getStatusColor(employee.status)}`} />
                          <span>{employee.name}</span>
                          <span className="text-xs text-gray-500">({employee.role})</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-3">
                  {messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-xs p-3 rounded-lg ${msg.isMe ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}>
                        <div className="flex items-center gap-2 mb-1">
                          <Avatar className="w-6 h-6">
                            <AvatarFallback className="text-xs">
                              {msg.senderName.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <p className="text-xs font-medium">{msg.senderName}</p>
                        </div>
                        <p className="text-sm">{msg.message}</p>
                        <p className="text-xs opacity-70 mt-1">{msg.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              
              <div className="p-4 border-t flex gap-2">
                <Input
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  disabled={!selectedEmployee}
                />
                <Button 
                  onClick={handleSendMessage} 
                  size="sm"
                  disabled={!selectedEmployee || !newMessage.trim()}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
