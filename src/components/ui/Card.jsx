export const Card = ({ children, className = '', title, action }) => {
    return (
        <div className={`
      bg-white dark:bg-[#14171C] 
      rounded-2xl shadow-sm dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)]
      border border-slate-200 dark:border-[#2A2E35] 
      overflow-hidden 
      transition-all duration-200
      hover:shadow-lg dark:hover:shadow-[0_10px_30px_rgba(0,0,0,0.4)]
      ${className}
    `}>
            {(title || action) && (
                <div className={`
          px-6 py-4 border-b border-slate-100 dark:border-[#1e2328] 
          flex justify-between items-center 
          bg-slate-50/50 dark:bg-[#0E1014]
        `}>
                    {title && <h3 className="text-lg font-semibold text-slate-800 dark:text-white">{title}</h3>}
                    {action && <div>{action}</div>}
                </div>
            )}
            <div className="p-6">
                {children}
            </div>
        </div>
    );
};
