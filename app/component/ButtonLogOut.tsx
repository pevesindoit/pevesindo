export default function ButtonLogOut({
    children,
    className = "",
    onClick,
    loading = false,
    ...rest
}: {
    children: React.ReactNode;
    className?: string;
    onClick?: () => void;
    loading?: boolean;
}) {
    return (
        <button
            {...rest}
            className={`block w-full text-[.5rem] py-[.5rem] px-[1rem] bg-black text-white rounded-md font-medium ${className} ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
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
