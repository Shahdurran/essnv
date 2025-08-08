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
import genericUserPhoto from "@assets/generic user pic_1754672840832.png";

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
  const userId = "example-user-demo";

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
      content: "Hi Dr. Example User! I'm your AI business analytics assistant. Ask me anything about your practice performance, forecasts, or key metrics across your 5 locations.",
      timestamp: new Date().toISOString(),
      isWelcome: true
    };
    
    setMessages([welcomeMessage]);
  }, []);

  /**
   * Handle scrolling for non-streaming messages (user messages and completed AI responses)
   */
  useEffect(() => {
    if (!messagesContainerRef.current || messages.length === 0) return;
    
    const lastMessage = messages[messages.length - 1];
    
    // For user messages, scroll to bottom immediately
    if (lastMessage.type === 'user') {
      messagesContainerRef.current.scrollTo({ 
        top: messagesContainerRef.current.scrollHeight, 
        behavior: "smooth" 
      });
    }
    
    // For completed AI messages (not streaming), scroll to bottom
    if (lastMessage.type === 'ai' && !lastMessage.isStreaming && lastMessage.content.length > 0) {
      setTimeout(() => {
        if (messagesContainerRef.current) {
          messagesContainerRef.current.scrollTo({ 
            top: messagesContainerRef.current.scrollHeight, 
            behavior: "smooth" 
          });
        }
      }, 100);
    }
  }, [messages]);

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

      // Submit query to AI assistant with location and time context
      const response = await submitAIQuery(contextualQuery, userId, selectedLocationId);
      
      // Implement streaming typing effect
      if (response.success) {
        const formattedResponse = formatAIResponse(response.data);
        
        // Create AI message placeholder
        const aiMessageId = `ai-${Date.now()}`;
        const aiMessage = {
          id: aiMessageId,
          type: "ai",
          content: "",
          timestamp: new Date().toISOString(),
          queryType: formattedResponse.type,
          recommendations: formattedResponse.recommendations,
          metrics: formattedResponse.metrics,
          isStreaming: true
        };

        setMessages(prev => [...prev, aiMessage]);
        
        // Simulate streaming typing effect
        await simulateTypingEffect(aiMessageId, formattedResponse.text, formattedResponse);
        
      } else {
        // Handle error response with typing delay
        setTimeout(() => {
          setIsTyping(false);
          const errorMessage = {
            id: `ai-error-${Date.now()}`,
            type: "ai",
            content: response.data.response,
            timestamp: new Date().toISOString(),
            isError: true
          };

          setMessages(prev => [...prev, errorMessage]);
          setIsLoading(false);
        }, 800);
      }

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
   * Simulate typing effect for AI responses with real-time scroll tracking
   * @param {string} messageId - The message ID to update
   * @param {string} fullText - The complete response text
   * @param {object} responseData - Additional response data
   */
  const simulateTypingEffect = async (messageId, fullText, responseData) => {
    const words = fullText.split(' ');
    let currentText = '';
    
    for (let i = 0; i < words.length; i++) {
      currentText += (i > 0 ? ' ' : '') + words[i];
      
      // Update the message content
      setMessages(prev => prev.map(msg => 
        msg.id === messageId 
          ? {
              ...msg,
              content: currentText,
              isStreaming: i < words.length - 1
            }
          : msg
      ));
      
      // Wait for DOM update, then scroll to follow the text
      await new Promise(resolve => {
        requestAnimationFrame(() => {
          if (messagesContainerRef.current) {
            const container = messagesContainerRef.current;
            const currentMessageElement = container.querySelector(`[data-message-id="${messageId}"]`);
            
            if (currentMessageElement) {
              // Get the actual content element within the message
              const contentElement = currentMessageElement.querySelector('.prose') || currentMessageElement;
              
              // Calculate the position where we want to scroll to keep the "typing cursor" visible
              const containerRect = container.getBoundingClientRect();
              const contentRect = contentElement.getBoundingClientRect();
              
              // Calculate how much of the content is below the visible area
              const contentBottom = contentRect.bottom - containerRect.top;
              const containerHeight = containerRect.height;
              
              // If content is growing beyond visible area, scroll to keep the bottom in view
              if (contentBottom > containerHeight - 50) { // 50px margin from bottom
                const scrollTarget = container.scrollTop + (contentBottom - containerHeight + 50);
                container.scrollTop = scrollTarget;
              }
            }
          }
          resolve();
        });
      });
      
      // Add variable delay between words for natural typing effect
      const delay = 30 + Math.random() * 40; // 30-70ms per word
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    // Mark main response streaming as complete
    setMessages(prev => prev.map(msg => 
      msg.id === messageId 
        ? { ...msg, isStreaming: false }
        : msg
    ));
    
    // If there's additional response data (recommendations, key metrics), stream them separately
    if (responseData && (responseData.recommendations || responseData.key_metrics)) {
      await streamAdditionalSections(messageId, responseData);
    }
    
    setIsTyping(false);
    setIsLoading(false);
  };

  /**
   * Stream additional sections (recommendations, key metrics) after main response
   * @param {string} messageId - The message ID to update
   * @param {object} responseData - The response data containing additional sections
   */
  const streamAdditionalSections = async (messageId, responseData) => {
    let additionalContent = '';
    
    // Build the additional content sections
    if (responseData.recommendations && responseData.recommendations.length > 0) {
      additionalContent += '\n\n**Recommendations:**\n';
      responseData.recommendations.forEach(rec => {
        additionalContent += `• ${rec}\n`;
      });
    }
    
    if (responseData.key_metrics) {
      additionalContent += '\n\n**Key Metrics:**\n';
      Object.entries(responseData.key_metrics).forEach(([key, value]) => {
        const formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        additionalContent += `• ${formattedKey}: ${value}\n`;
      });
    }
    
    if (additionalContent.trim()) {
      // Get current message content
      const currentMessage = messages.find(msg => msg.id === messageId);
      if (!currentMessage) return;
      
      const baseContent = currentMessage.content;
      const words = additionalContent.trim().split(' ');
      let streamedContent = '';
      
      // Mark as streaming additional content
      setMessages(prev => prev.map(msg => 
        msg.id === messageId 
          ? { ...msg, isStreaming: true }
          : msg
      ));
      
      // Stream each word of the additional content
      for (let i = 0; i < words.length; i++) {
        streamedContent += (i > 0 ? ' ' : '') + words[i];
        
        setMessages(prev => prev.map(msg => 
          msg.id === messageId 
            ? {
                ...msg,
                content: baseContent + streamedContent,
                isStreaming: i < words.length - 1
              }
            : msg
        ));
        
        // Wait for DOM update and handle scrolling
        await new Promise(resolve => {
          requestAnimationFrame(() => {
            if (messagesContainerRef.current) {
              const container = messagesContainerRef.current;
              const currentMessageElement = container.querySelector(`[data-message-id="${messageId}"]`);
              
              if (currentMessageElement) {
                const contentElement = currentMessageElement.querySelector('.prose') || currentMessageElement;
                const containerRect = container.getBoundingClientRect();
                const contentRect = contentElement.getBoundingClientRect();
                const contentBottom = contentRect.bottom - containerRect.top;
                const containerHeight = containerRect.height;
                
                if (contentBottom > containerHeight - 50) {
                  const scrollTarget = container.scrollTop + (contentBottom - containerHeight + 50);
                  container.scrollTop = scrollTarget;
                }
              }
            }
            resolve();
          });
        });
        
        // Add delay between words
        const delay = 25 + Math.random() * 25; // Slightly faster for additional sections
        await new Promise(resolve => setTimeout(resolve, delay));
      }
      
      // Mark streaming as complete but don't add responseData since it's now part of content
      setMessages(prev => prev.map(msg => 
        msg.id === messageId 
          ? {
              ...msg,
              content: baseContent + streamedContent,
              isStreaming: false,
              responseData: null // Don't add responseData to prevent duplicate rendering
            }
          : msg
      ));
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
              data-message-type={message.type}
              data-message-id={message.id}
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
                
                {/* Recommendations and Key Metrics are now streamed as part of content, no separate rendering needed */}
                
                <p className="text-xs opacity-70 mt-2">
                  {new Date(message.timestamp).toLocaleTimeString()}
                </p>
              </div>
              
              {message.type === 'user' && (
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg overflow-hidden flex-shrink-0 ml-2 sm:ml-3">
                  <img 
                    src={genericUserPhoto} 
                    alt="Dr. Example User"
                    className="w-full h-full object-cover"
                  />
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
