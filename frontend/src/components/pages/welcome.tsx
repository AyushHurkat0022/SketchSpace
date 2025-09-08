import React, { useEffect, useState } from 'react';
import { useNavigate } from "react-router-dom";

const welcomeLines = [
    [
        { text: 'Welcome to my ', highlight: false },
        { text: 'SketchSpace', highlight: true },
        { text: '!', highlight: false }
    ],
    [
        { text: 'Here, you can ', highlight: false },
        { text: 'draw', highlight: true },
        { text: ', ', highlight: false },
        { text: 'create', highlight: true },
        { text: ' and ', highlight: false },
        { text: 'download', highlight: true },
        { text: ' in real-time.', highlight: false }
    ],
    [
        { text: 'Whether you’re ', highlight: false },
        { text: 'brainstorming', highlight: true },
        { text: ', ', highlight: false },
        { text: 'sketching ideas', highlight: true },
        { text: ', or just having ', highlight: false },
        { text: 'fun', highlight: true },
        { text: ',', highlight: false }
    ],
    [
        { text: 'this app provides an ', highlight: false },
        { text: 'intuitive', highlight: true },
        { text: ' and ', highlight: false },
        { text: 'interactive', highlight: true },
        { text: ' space to bring your ', highlight: false },
        { text: 'thoughts to life', highlight: true },
        { text: '.', highlight: false }
    ],
    [
        { text: 'I hope you ', highlight: false },
        { text: 'enjoy', highlight: true },
        { text: ' using it and find it as ', highlight: false },
        { text: 'useful', highlight: true },
        { text: ' as I intended!', highlight: false }
    ]
];

const WelcomePage: React.FC = () => {
    const [currentLine, setCurrentLine] = useState(0);
    const [currentSegment, setCurrentSegment] = useState(0);
    const [currentChar, setCurrentChar] = useState(0);
    const [displayedContent, setDisplayedContent] = useState<JSX.Element[]>([]);

    const navigate = useNavigate();

    const handleLogin = () => {
        navigate("/auth");
    }

    useEffect(() => {
        if (currentLine >= welcomeLines.length) return;

        const line = welcomeLines[currentLine];
        if (currentSegment >= line.length) {
            const timeout = setTimeout(() => {
                setCurrentLine(l => l + 1);
                setCurrentSegment(0);
                setCurrentChar(0);
            }, 100);
            return () => clearTimeout(timeout);
        }

        const segment = line[currentSegment];
        if (currentChar < segment.text.length) {
            const timeout = setTimeout(() => {
                setCurrentChar(c => c + 1);
            }, 50);
            return () => clearTimeout(timeout);
        } else {
            setCurrentSegment(s => s + 1);
            setCurrentChar(0);
        }
    }, [currentLine, currentSegment, currentChar]);

    useEffect(() => {
        const newContent: JSX.Element[] = [];
        for (let lineIdx = 0; lineIdx <= currentLine; lineIdx++) {
            if (lineIdx >= welcomeLines.length) break;

            const lineContent: JSX.Element[] = [];
            for (let segIdx = 0; segIdx < welcomeLines[lineIdx].length; segIdx++) {
                const segment = welcomeLines[lineIdx][segIdx];

                if (lineIdx < currentLine || (lineIdx === currentLine && segIdx < currentSegment)) {
                    lineContent.push(
                        segment.highlight ? (
                            <span key={segIdx} style={{ color: '#e0ae2a', fontWeight: 'bold' }}>
                                {segment.text}
                            </span>
                        ) : <span key={segIdx}>{segment.text}</span>
                    );
                } else if (lineIdx === currentLine && segIdx === currentSegment) {
                    const visibleText = segment.text.slice(0, currentChar);
                    lineContent.push(
                        segment.highlight ? (
                            <span key={segIdx} style={{ color: '#e0ae2a', fontWeight: 'bold' }}>
                                {visibleText}
                            </span>
                        ) : <span key={segIdx}>{visibleText}</span>
                    );
                }
            }
            newContent.push(<div key={lineIdx}>{lineContent}</div>);
        }
        setDisplayedContent(newContent);
    }, [currentLine, currentSegment, currentChar]);

    return (
        <div className="min-h-screen p-8 rounded-lg shadow-lg text-center max-w-full flex flex-col justify-center items-center bg-starry relative">

            {/* Beta Label */}
            <div className="absolute top-4 right-4 text-xs text-gray-500 font-semibold z-50">
                Beta
            </div>

            {/* Header */}
            <div className="header absolute top-0 left-0 right-0 p-8 text-center z-20 mb-4">
                <h1 className="text-yellow-600 text-4xl font-bold mb-2 lg:text-5xl drop-shadow-[0px_0px_32px_rgba(224,174,42,1.0)]">
                    SketchSpace
                </h1>
                <p className="text-green-600 italic ml-36 mb-6 lg:text-xl drop-shadow-[0px_0px_16px_rgba(112,240,144,1)]">
                    Draw Your Vision, Share Your Story.
                </p>
            </div>

            {/* Welcome Message */}
            <div className="welcome-msg left-aligned bg-gray-100 p-6 pl-14 pr-14 rounded-lg border border-yellow-600 lg:p-10 max-w-2xl w-full lg: z-10 relative">
                {displayedContent}
            </div>

            {/* Login Button */}
            <div className="login fixed bottom-0 left-0 right-0 text-center p-4 bg-starry bg-opacity-90 z-30">
                <button onClick={handleLogin} className="border-2 border-[#e0ae2a] rounded-xl m-4 p-2 bg-[#F1E7D4] hover:bg-[#e0ae2a] hover:text-white transition-colors duration-300">
                    Lets Get Started
                </button>

                {/* Note Below Button */}
                <p className="text-sm text-gray-600 mt-2">
                    The canvas and sharing features are live and ready to use. Real-time collaboration is coming soon. Enjoy exploring the canvas!
                </p>
            </div>
        </div>
    );
};

export default WelcomePage;