import Image from "next/image";

export default function LoadingTemplate() {
    return (
        <div className="flex h-screen w-screen items-center justify-center bg-white">
            <div className="relative h-20 w-20">
                {/* Spinner ring */}
                <div className="absolute inset-0 animate-spin border-4 border-yellow-500 border-t-transparent rounded-full" />
                {/* Static logo in center */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <Image
                        src="/logo-s.png"
                        alt="Loading..."
                        width={40}
                        height={40}
                    />
                </div>
            </div>
        </div>

    );
}
