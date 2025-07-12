export default function Button({
    children,
    className = "",
    onClick,
    loading = false,
    ...rest
}: {
    children: React.ReactNode;
    className?: string;
    onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
    loading?: boolean;
}) {
    return (
        <button
            {...rest}
            className={`cursor-pointer block w-full py-[1rem] px-[.5rem] bg-black text-white font-medium rounded-[10px] ${className} ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={!loading ? onClick : undefined}
            disabled={loading}
        >
            {loading ? (
                <span className="flex items-center justify-center gap-2">
                    <span className="animate-spin border-2 border-white border-t-transparent rounded-full w-4 h-4" />
                    Loading...
                </span>
            ) : (
                children
            )}
        </button>
    );
}
