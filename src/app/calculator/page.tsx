export default function CalculatorPage() {
    return (
        <div className="grid h-screen place-items-center overflow-y-auto">
            <iframe
                src="https://ti84calc.com/ti84calc"
                width="600px"
                height="800px"
                allow="fullscreen"
            ></iframe>
        </div>
    );
}
