import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { submitAIQuery, getPopularQuestions, formatAIResponse } from "@/lib/openai";
import { 
  Bot, 
  Send, 
  TrendingUp, 
  DollarSign, 
  Clock, 
  Activity, 
  BarChart3, 
  Trophy,
  MessageSquare,
  Loader2
} from "lucide-react";

/**
 * AIBusinessAssistant Component
 * 
 * Main chat interface for the AI-powered business analytics assistant.
 * Integrates with OpenAI GPT-4o to provide natural language analytics queries
 * for Rao Dermatology practice management and business intelligence.
 * 
 * Features:
 * - ChatGPT-style conversation interface
 * - Popular questions grid for quick access
 * - Real-time AI responses with dermatology context
 * - Query history and conversation persistence
 * - Integration with practice location filtering
 * - Professional medical UI design
 * 
 * @param {Object} props - Component properties
 * @param {string} props.selectedLocationId - Currently selected location for context
 */
export default function AIBusinessAssistant({ selectedLocationId }) {
  
  // State management for chat interface
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  
  // Ref for auto-scrolling chat messages
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  
  // Static user ID for demo purposes (in production, this would come from auth)
  const userId = "dr-rao-demo";

  /**
   * Fetch popular questions for the quick access grid
   */
  const { data: popularQuestions = [], isLoading: questionsLoading } = useQuery({
    queryKey: ['/api/ai/popular-questions'],
    staleTime: 10 * 60 * 1000, // Cache for 10 minutes
  });

  /**
   * Initialize chat with welcome message on component mount
   */
  useEffect(() => {
    const welcomeMessage = {
      id: "welcome",
      type: "ai",
      content: "Hi Dr. Rao! I'm your AI business analytics assistant. Ask me anything about your practice performance, forecasts, or key metrics across your 5 locations.",
      timestamp: new Date().toISOString(),
      isWelcome: true
    };
    
    setMessages([welcomeMessage]);
  }, []);

  /**
   * Auto-scroll to bottom when new messages are added
   */
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  /**
   * Scroll chat container to bottom
   */
  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  /**
   * Handle sending a message to the AI assistant
   * @param {string} messageText - The message text to send
   * @param {boolean} isQuickQuestion - Whether this is from a popular question click
   */
  const handleSendMessage = async (messageText = inputMessage, isQuickQuestion = false) => {
    const trimmedMessage = messageText.trim();
    
    if (!trimmedMessage || isLoading) return;

    // Add user message to chat
    const userMessage = {
      id: `user-${Date.now()}`,
      type: "user",
      content: trimmedMessage,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);
    setIsTyping(true);

    try {
      // Add location context to the query if a specific location is selected
      let contextualQuery = trimmedMessage;
      if (selectedLocationId && selectedLocationId !== "all") {
        contextualQuery += ` (focus on ${selectedLocationId} location data)`;
      }

      // Submit query to AI assistant
      const response = await submitAIQuery(contextualQuery, userId);
      
      // Simulate typing delay for better UX
      setTimeout(() => {
        setIsTyping(false);
        
        if (response.success) {
          const formattedResponse = formatAIResponse(response.data);
          
          const aiMessage = {
            id: `ai-${Date.now()}`,
            type: "ai",
            content: formattedResponse.text,
            timestamp: new Date().toISOString(),
            queryType: formattedResponse.type,
            recommendations: formattedResponse.recommendations,
            metrics: formattedResponse.metrics
          };

          setMessages(prev => [...prev, aiMessage]);
        } else {
          // Handle error response
          const errorMessage = {
            id: `ai-error-${Date.now()}`,
            type: "ai",
            content: response.data.response,
            timestamp: new Date().toISOString(),
            isError: true
          };

          setMessages(prev => [...prev, errorMessage]);
        }
        
        setIsLoading(false);
      }, isQuickQuestion ? 1000 : 1500); // Shorter delay for quick questions

    } catch (error) {
      setIsTyping(false);
      setIsLoading(false);
      
      console.error("Error sending message to AI:", error);
      
      const errorMessage = {
        id: `error-${Date.now()}`,
        type: "ai",
        content: "I apologize, but I'm experiencing technical difficulties. Please try your question again in a moment.",
        timestamp: new Date().toISOString(),
        isError: true
      };

      setMessages(prev => [...prev, errorMessage]);
    }
  };

  /**
   * Handle popular question click
   * @param {Object} question - The popular question object
   */
  const handleQuestionClick = (question) => {
    handleSendMessage(question.question, true);
  };

  /**
   * Handle Enter key press in textarea
   * @param {KeyboardEvent} e - The keyboard event
   */
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  /**
   * Get icon component for popular questions
   * @param {string} iconName - The icon name
   */
  const getQuestionIcon = (iconName) => {
    const iconMap = {
      "chart-line": TrendingUp,
      "dollar-sign": DollarSign,
      "clock": Clock,
      "cut": Activity,
      "balance-scale": BarChart3,
      "trophy": Trophy
    };
    
    const IconComponent = iconMap[iconName] || MessageSquare;
    return <IconComponent className="h-4 w-4" />;
  };

  return (
    <Card className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      
      {/* AI Assistant Header - Mobile Responsive */}
      <div className="bg-gradient-to-r from-primary to-blue-700 p-4 sm:p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 sm:space-x-4 min-w-0 flex-1">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <Bot className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-lg sm:text-xl font-bold truncate">AI Business Assistant</h3>
              <p className="text-xs sm:text-sm text-blue-100 hidden sm:block">
                Ask anything about your practice performance across all 5 locations
              </p>
              <p className="text-xs text-blue-100 sm:hidden">
                Ask about practice performance
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            <span className="text-xs sm:text-sm text-blue-100">Online</span>
          </div>
        </div>
      </div>

      {/* Chat Interface - Mobile Responsive */}
      <div className="p-4 sm:p-6">
        
        {/* Messages Container - Mobile Responsive */}
        <div ref={messagesContainerRef} className="h-60 sm:h-80 overflow-y-auto mb-4 sm:mb-6 space-y-3 sm:space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.type === 'ai' && (
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 mr-2 sm:mr-3">
                  <Bot className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
                </div>
              )}
              
              <div
                className={`max-w-[85%] sm:max-w-[80%] p-3 sm:p-4 rounded-2xl ${
                  message.type === 'user'
                    ? 'bg-primary text-white rounded-br-sm'
                    : message.isError
                    ? 'bg-red-50 text-red-800 border border-red-200 rounded-tl-sm'
                    : 'bg-gray-50 text-gray-800 rounded-tl-sm'
                }`}
              >
                <div 
                  className="prose prose-sm max-w-none whitespace-pre-wrap"
                  dangerouslySetInnerHTML={{
                    __html: message.content
                      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                      .replace(/\*(.*?)\*/g, '<em>$1</em>')
                      .replace(/`(.*?)`/g, '<code class="bg-gray-100 px-1 rounded text-sm">$1</code>')
                      .replace(/\n/g, '<br>')
                  }}
                />
                
                {/* Show recommendations if available */}
                {message.recommendations && message.recommendations.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-sm font-medium text-gray-700 mb-2">Recommendations:</p>
                    <ul className="space-y-1">
                      {message.recommendations.map((rec, index) => (
                        <li key={index} className="text-sm text-gray-600">• {rec}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {/* Show key metrics if available */}
                {message.metrics && Object.keys(message.metrics).length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-sm font-medium text-gray-700 mb-2">Key Metrics:</p>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(message.metrics).map(([key, value]) => (
                        <div key={key} className="text-xs">
                          <span className="text-gray-500">{key}:</span>
                          <span className="text-gray-700 font-medium ml-1">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <p className="text-xs opacity-70 mt-2">
                  {new Date(message.timestamp).toLocaleTimeString()}
                </p>
              </div>
              
              {message.type === 'user' && (
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gray-300 rounded-lg flex items-center justify-center flex-shrink-0 ml-2 sm:ml-3">
                  <span className="text-xs font-medium text-gray-700">DR</span>
                </div>
              )}
            </div>
          ))}
          
          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex justify-start">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 mr-3">
                <Bot className="h-4 w-4 text-primary" />
              </div>
              <div className="bg-gray-50 p-4 rounded-2xl rounded-tl-sm">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area - Mobile Responsive */}
        <div className="relative">
          <Textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about patient volume, revenue, AR days, forecasts..."
            className="w-full pr-12 sm:pr-14 resize-none focus:ring-2 focus:ring-primary focus:border-primary text-sm sm:text-base"
            rows={2}
            disabled={isLoading}
          />
          <Button
            onClick={() => handleSendMessage()}
            disabled={!inputMessage.trim() || isLoading}
            className="absolute bottom-2 sm:bottom-3 right-2 sm:right-3 h-8 w-8 sm:h-10 sm:w-10 p-0"
          >
            {isLoading ? (
              <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
            ) : (
              <Send className="h-3 w-3 sm:h-4 sm:w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Popular Questions Grid - Mobile Responsive */}
      <div className="border-t border-gray-100 p-4 sm:p-6">
        <h4 className="text-sm font-medium text-gray-900 mb-3 sm:mb-4 flex items-center">
          <MessageSquare className="h-4 w-4 mr-2" />
          Popular Questions:
        </h4>
        
        {questionsLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
            {[...Array(6)].map((_, index) => (
              <div key={index} className="h-10 sm:h-12 bg-gray-200 animate-pulse rounded-lg"></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
            {popularQuestions.map((question) => (
              <Button
                key={question.id}
                variant="outline"
                className="text-left p-2 sm:p-3 h-auto justify-start hover:bg-gray-50 transition-colors"
                onClick={() => handleQuestionClick(question)}
                disabled={isLoading}
              >
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <div className="text-primary flex-shrink-0">
                    {getQuestionIcon(question.icon)}
                  </div>
                  <span className="text-xs sm:text-sm text-gray-700 truncate">{question.question}</span>
                </div>
              </Button>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
