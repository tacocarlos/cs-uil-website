export default function CalculatorPage() {
    return (
        <div className="grid min-h-dvh place-items-center px-4 pt-20 pb-4">
            <iframe
                src="https://ti84calc.com/ti84calc"
                className="aspect-[3/4] w-full max-w-[600px]"
                allow="fullscreen"
            ></iframe>
        </div>
    );
}
