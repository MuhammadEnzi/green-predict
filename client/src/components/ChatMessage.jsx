const ChatMessage = ({ role, content }) => {
    const isAssistant = role === 'assistant';
    return (
      <div className={`flex items-start gap-3 md:gap-4 ${!isAssistant && 'flex-row-reverse'}`}>
        <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${isAssistant ? 'bg-brand-green' : 'bg-brand-gray'}`}>
          {isAssistant ? 'AI' : 'U'}
        </div>
        <div 
          className={`px-5 py-4 rounded-xl max-w-2xl prose prose-sm prose-p:my-1 prose-ul:my-1 prose-invert ${isAssistant ? 'bg-brand-dark' : 'bg-brand-dark-secondary'}`}
          dangerouslySetInnerHTML={{ __html: content }}
        >
        </div>
      </div>
    );
};

export default ChatMessage;