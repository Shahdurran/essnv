/*
 * AI BUSINESS ASSISTANT COMPONENT
 * ===============================
 * 
 * This is the core AI-powered chat interface that enables users to ask natural
 * language questions about their medical practice analytics and receive intelligent,
 * contextual responses powered by OpenAI's GPT-4o model.
 * 
 * BUSINESS INTELLIGENCE VALUE:
 * Traditional analytics dashboards require users to:
 * - Navigate complex menu structures
 * - Understand business intelligence terminology
 * - Manually correlate data across different reports
 * - Interpret charts and metrics themselves
 * 
 * Our AI assistant instead lets users ask questions like:
 * - "What's our top revenue procedure this month?"
 * - "Why are insurance denials high in Manhattan?"
 * - "How do cosmetic procedures compare across locations?"
 * - "What's driving the revenue increase in Q2?"
 * 
 * AI ARCHITECTURE:
 * - Frontend: React chat interface with streaming responses
 * - Backend: Express.js API that processes queries and calls OpenAI
 * - AI Model: GPT-4o with custom prompting for medical practice context
 * - Data Integration: AI responses include real practice data and context
 * 
 * ADVANCED REACT PATTERNS:
 * - Multiple useState hooks for complex chat state
 * - useEffect for side effects (scrolling, initialization)
 * - useRef for DOM manipulation (auto-scroll)
 * - Custom hooks for AI integration
 * - Streaming response handling with typing animations
 * 
 * USER EXPERIENCE FEATURES:
 * - Real-time typing indicators during AI response generation
 * - Auto-scrolling to keep latest messages visible
 * - Popular questions for quick access to common queries
 * - Loading states and error handling
 * - Mobile-responsive chat interface
 */

// React hooks for state management and side effects
import { useState, useEffect, useRef } from "react";
// TanStack Query for server state management
import { useQuery } from "@tanstack/react-query";
// Shadcn UI components for consistent design
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
// Custom OpenAI integration utilities
import { submitAIQuery, getPopularQuestions, formatAIResponse } from "@/lib/openai";
// Lucide React icons for chat interface
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
// User avatar for chat interface
import drJohnJosephsonPhoto from "@assets/Dr. John Josephson_1757862871625.jpeg";

/*
 * TYPESCRIPT INTERFACE DEFINITIONS
 * ================================
 * 
 * Define interfaces for type safety and better IDE support.
 * This prevents bugs and makes the code self-documenting.
 */
interface AIBusinessAssistantProps {
  selectedLocationId: string;  // Current location filter for contextual AI responses
}

interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: string;
  isWelcome?: boolean;
}

/*
 * MAIN AI BUSINESS ASSISTANT COMPONENT
 * ====================================
 * 
 * This component creates a ChatGPT-style interface specifically designed for
 * medical practice business intelligence. It combines modern chat UX with
 * powerful AI analytics capabilities.
 * 
 * COMPONENT RESPONSIBILITIES:
 * 1. Manage chat conversation state and history
 * 2. Handle user input and message submission
 * 3. Process AI responses with streaming animations
 * 4. Provide popular questions for quick access
 * 5. Auto-scroll to keep conversation visible
 * 6. Integrate location context into AI queries
 * 
 * STATE MANAGEMENT STRATEGY:
 * - messages: Array of chat messages (user and AI)
 * - inputMessage: Current user input text
 * - isLoading: Whether AI is processing a query
 * - isTyping: Whether AI response is being "typed" out
 * 
 * @param {AIBusinessAssistantProps} props - Component properties
 */
export default function AIBusinessAssistant({ selectedLocationId }: AIBusinessAssistantProps) {
  
  /*
   * COMPONENT STATE MANAGEMENT
   * ==========================
   * 
   * This component manages several pieces of state to create a rich chat experience:
   */
  
  /*
   * CHAT MESSAGES STATE
   * Array of all messages in the conversation, both user and AI messages.
   * Each message includes ID, type, content, timestamp, and optional flags.
   */
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  
  /*
   * USER INPUT STATE
   * Current text in the message input field. Controlled by this component
   * and updated as user types.
   */
  const [inputMessage, setInputMessage] = useState("");
  
  /*
   * LOADING STATE
   * Indicates when an AI query is being processed on the server.
   * Used to show loading spinners and disable input during processing.
   */
  const [isLoading, setIsLoading] = useState(false);
  
  /*
   * TYPING ANIMATION STATE
   * Indicates when AI response is being "typed" out with realistic timing.
   * Creates a more natural chat experience than instant message appearance.
   */
  const [isTyping, setIsTyping] = useState(false);
  
  /*
   * DOM REFERENCES FOR CHAT BEHAVIOR
   * ================================
   * 
   * These refs allow us to interact with DOM elements for chat functionality:
   */
  
  /*
   * Auto-scroll reference for newest messages
   * Points to an invisible element at the bottom of message list
   */
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  /*
   * Messages container reference for scroll control
   * Points to the scrollable container holding all messages
   */
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  
  /*
   * DEMO USER CONFIGURATION
   * =======================
   * 
   * In a production app, this would come from authentication system.
   * For demo purposes, we use a static user ID.
   */
  const userId = "example-user-demo";

  /*
   * POPULAR QUESTIONS DATA FETCHING
   * ===============================
   * 
   * Fetch pre-defined popular questions that users commonly ask.
   * These provide quick access to common analytics queries and help
   * users discover the AI assistant's capabilities.
   * 
   * QUERY CONFIGURATION:
   * - Cache for 10 minutes since popular questions don't change often
   * - Default to empty array to prevent undefined errors
   */
  const { data: popularQuestions = [], isLoading: questionsLoading } = useQuery({
    queryKey: ['/api/ai/popular-questions'],
    staleTime: 10 * 60 * 1000, // Cache for 10 minutes
  });

  /*
   * COMPONENT INITIALIZATION EFFECT
   * ===============================
   * 
   * Set up the initial welcome message when component mounts.
   * This provides context and encourages user interaction.
   */
  useEffect(() => {
    const welcomeMessage: ChatMessage = {
      id: "welcome",
      type: "ai",
      content: "Hi Dr. John Josephson! I'm your AI business analytics assistant. Ask me anything about your practice performance, forecasts, or key metrics across your 2 locations.",
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
                Ask anything about your practice performance across all 2 locations
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
                    src={drJohnJosephsonPhoto} 
                    alt="Dr. John Josephson"
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
