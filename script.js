/* script.js - Unified Multi-Page Logic Engine */

// ==========================================================================
// 1. PAGE 1 LOGIC: INTRO & REVEAL OVERLAY (Only runs on index.html)
// ==========================================================================
const startBtn = document.getElementById('start-btn');
const container = document.getElementById('experience-container');
const landingScreen = document.getElementById('landing-screen');
const missionScreen = document.getElementById('mission-screen');
const clockModule = document.getElementById('clock-module');
const clockDisplay = document.getElementById('clock-display');
const targetImg = document.getElementById('target-img');
const dialogHolder = document.getElementById('dialog-holder');


// Page 1 Story Sequences
const storyData = {
    intro: [
        "Welcome aboard, fellow scientists! I'm the Ocean Protector, Fin.",
        "Today, we are going to explore a very important species.",
        "Can you guess the species within 3 seconds?"
    ],
    reveal: [
        "That's right! It's a Blacktip Reef Shark! They are fast swimmers and often found near shallow corals."
    ],
    explanation: [
        "Today, for our first mission, we will be counting them. The reason why we count them is to track shark populations, understand the health of marine ecosystems, and protect the shark species from overfishing or extinction."
    ]
};

let lineIndex = 0;
let currentPhase = "intro";

// ==========================================================================
// FIN VOICEOVER — play recorded clips, fall back to browser TTS if a clip is missing
// ==========================================================================
let finAudio = null;
window.__finSpeaking = false;   // read by ocean-fx.js for the glow + animation control
function finCancel() {
    if (finAudio) { try { finAudio.pause(); } catch (e) {} finAudio = null; }
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    window.__finSpeaking = false;
}
function finSpeak(audioFile, text, onDone) {
    finCancel();
    window.__finSpeaking = true;
    const finishAll = () => { window.__finSpeaking = false; if (onDone) onDone(); };
    if (audioFile) {
        const a = new Audio('../audio/voiceover/' + audioFile);
        finAudio = a;
        let finished = false;
        const done = () => { if (finished) return; finished = true; finishAll(); };
        a.onended = done;
        a.onerror = () => { ttsSpeak(text, done); };        // clip missing -> old voice
        a.play().catch(() => { ttsSpeak(text, done); });    // blocked/failed -> old voice
        return;
    }
    ttsSpeak(text, finishAll);
}
function ttsSpeak(text, onDone) {
    if (!('speechSynthesis' in window)) { if (onDone) setTimeout(onDone, 1500); return; }
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    const v = voices.find(x => x.name.includes('David')) || voices.find(x => x.lang.startsWith('en'));
    if (v) u.voice = v;
    u.pitch = 0.9; u.rate = 1.0;
    u.onend = function () { if (onDone) onDone(); };
    window.speechSynthesis.speak(u);
}

// Recorded clip filenames (in audio/voiceover/) mapped to each spoken line
const storyAudio = {
    intro: ['01-intro-1.mp3', '01-intro-2.mp3', '01-intro-3.mp3'],
    reveal: ['04-reveal.mp3'],
    explanation: ['05-explanation.mp3']
};

// Gate: Only activate Page 1 code if we are on index.html
// Landing-screen background music: loops on the start screen, stops on Let's Go
let landingMusic = null;
if (startBtn) {
    try {
        landingMusic = new Audio('../audio/backgroundmusic.mp3');
        landingMusic.loop = true;
        landingMusic.volume = 0.7;
        window.__landingMusic = landingMusic;   // so the mute button can control it on the landing
        if (localStorage.getItem('oceanx-muted') !== '1') {
            landingMusic.play().catch(() => {});
        }
    } catch (e) {}

    startBtn.addEventListener('click', () => {
        // Stop the landing music the moment we dive in
        window.__dived = true;
        if (landingMusic) { try { landingMusic.pause(); landingMusic.currentTime = 0; } catch (e) {} }

        // Now bring in the ocean audio (bubbles + melody)
        if (window.__startOceanAudio) window.__startOceanAudio();

        // "Dive in" whoosh as we submerge into the ocean
        try {
            if (localStorage.getItem('oceanx-muted') !== '1') {
                const whoosh = new Audio('../audio/whoosh.mp3');
                whoosh.volume = 0.85;
                whoosh.play().catch(() => {});
            }
        } catch (e) {}

        landingScreen.classList.add('fade-out');
        container.classList.add('submerged');
        missionScreen.classList.add('fade-in');

        setTimeout(() => {
            runStoryEngine();
        }, 3000);
    });
}

function runStoryEngine() {
    const currentLines = storyData[currentPhase];

    if (lineIndex < currentLines.length) {
        const text = currentLines[lineIndex];
        
        const bubble = document.createElement('div');
        bubble.className = "speech-bubble visible";
        bubble.innerText = text;
        dialogHolder.appendChild(bubble);

        const audioFile = (storyAudio[currentPhase] && storyAudio[currentPhase][lineIndex]) || null;
        finSpeak(audioFile, text, function () {
            lineIndex++;

            if (currentPhase === "intro" && lineIndex === currentLines.length) {
                startClockTimer();
            } else if (currentPhase === "reveal" && lineIndex === currentLines.length) {
                setTimeout(() => {
                    currentPhase = "explanation";
                    lineIndex = 0;
                    dialogHolder.innerHTML = "";
                    runStoryEngine();
                }, 800);
            } else if (currentPhase === "explanation" && lineIndex === currentLines.length) {
                // Show final continuation navigation button
                if (nextPageBtn) nextPageBtn.style.display = "block";
                // Fin has finished his intro — settle him into the Idle clip
                const introModel = document.querySelector('model-viewer');
                if (introModel) {
                    try { introModel.animationName = 'Idle'; if (introModel.play) introModel.play(); } catch (e) {}
                }
            } else {
                setTimeout(() => {
                    runStoryEngine();
                }, 600);
            }
        });
    }
}


function startClockTimer() {
    let count = 3;
    clockDisplay.innerText = count;
    clockModule.classList.add('active');

    // Play the 3-2-1 countdown sound — its beeps at 0s/1s/2s line up with 3, 2, 1
    try {
        if (localStorage.getItem('oceanx-muted') !== '1') {
            const cdAudio = new Audio('../audio/countingdown.m4a');
            cdAudio.volume = 0.85;
            cdAudio.play().catch(() => {});
        }
    } catch (e) {}

    const interval = setInterval(() => {
        count--;
        if (count > 0) {
            clockDisplay.innerText = count;
        } else {
            clearInterval(interval);
            clockModule.classList.remove('active'); 
            currentPhase = "reveal";
            lineIndex = 0;
            dialogHolder.innerHTML = ""; 
            targetImg.src = "../images/sharkshow.jpg"; 
            runStoryEngine();
        }
    }, 1000);
}

// 1. Target the button via its unique ID
const nextPageBtn = document.getElementById('next-page-btn');

// 2. Add a safe guard check to prevent code crashes
if (nextPageBtn) {
    nextPageBtn.addEventListener('click', (e) => {
        e.preventDefault(); // Prevents any weird browser form actions
        
        console.log("Button clicked! Redirecting to index2.html...");
        
        // Clear any running text-to-speech cues cleanly
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
        }
        
        // Redirect the browser window destination
        window.location.href = "index2.html"; 
    });
} else {
    console.error("Could not find an element with ID 'next-page-btn' inside the HTML!");
}




// ==========================================================================
// 2. PAGE 2 LOGIC: VOICE OVER & VIDEO AUTO-START (Only runs on index2.html)
// ==========================================================================
const readyBtn = document.getElementById('ready-btn');
const missionVideo = document.getElementById('mission-video');

// Gate: Only activate Page 2 code if we are currently looking at index2.html
if (readyBtn) {
    // Read the rules rules out loud as soon as page 2 components fully load
    window.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            const rulesText = "Scientists estimate shark populations using the moment where the most sharks appear in one video frame. We will do the same for this mission! The greatest number of sharks spotted at one time will be our final shark count, not the total number of sharks seen throughout the footage! The video on the right is an example of a video that you guys would have to keep track of the sharks in one frame.";
            speakPageTwoRules(rulesText);
        }, 800);
    });

    // Handle standard navigation jump over to index3.html
    readyBtn.addEventListener('click', () => {
        if ('speechSynthesis' in window) window.speechSynthesis.cancel();
        window.location.href = "index3.html"; 
    });
}

function speakPageTwoRules(text) {
    // Fin reads the rules, then the example video auto-plays
    finSpeak('06-rules.mp3', text, function () {
        if (missionVideo) {
            missionVideo.play().catch(err => console.log("Video auto playback blocked: ", err));
        }
    });
}


// ==========================================================================
// 3. PAGE 3 LOGIC: INTERACTIVE CLICK TRACKING & TIMER (Runs on index3.html)
// ==========================================================================
const targetZone = document.getElementById('click-target-zone');
const trackButton = document.getElementById('track-trigger-btn');
const counterScore = document.getElementById('counter-score');
const activeVideo = document.getElementById('active-mission-video');

// Countdown Overlay Elements
const countdownOverlay = document.getElementById('countdown-overlay');
const countdownNumber = document.getElementById('countdown-number');

// Gate: Only activate Tracker code if we are looking at index3.html
if (counterScore) {
    let internalCount = 0;

    // --- COUNTDOWN TIMER SYSTEM ---
    if (countdownOverlay && countdownNumber && activeVideo) {
        let timeLeft = 3;

        const countdownInterval = setInterval(() => {
            timeLeft--;
            
            if (timeLeft > 0) {
                countdownNumber.innerText = timeLeft;
            } else {
                clearInterval(countdownInterval);

                // Show "GO!" (lines up with the final beep of countdown.wav)
                countdownNumber.innerText = "GO!";

                // Hold GO! briefly, then fade the mask and start the video
                setTimeout(() => {
                    countdownOverlay.style.opacity = '0';
                    setTimeout(() => {
                        countdownOverlay.style.display = 'none';
                        activeVideo.play().catch(err => console.log("Playback error: ", err));
                    }, 300);
                }, 700);
            }
        }, 1000);
    }

    // Increments counter when students click anywhere directly inside the video area
    targetZone.addEventListener('mousedown', () => {
        // Protect counter: Only track if the countdown screen is completely gone
        if (!countdownOverlay || countdownOverlay.style.display === 'none') {
            registerSharkTrack();
        }
    });

    if (trackButton) {
        trackButton.addEventListener('click', (event) => {
            event.stopPropagation(); // Prevents double counting registering both layers simultaneously
            
            // Protect counter: Only track if the countdown screen is completely gone
            if (!countdownOverlay || countdownOverlay.style.display === 'none') {
                registerSharkTrack();
            }
        });
    }

    if (activeVideo) {
        // Listens for the video to reach its final frame
        activeVideo.addEventListener('ended', () => {
            // Stop any background voice synthesis
            if ('speechSynthesis' in window) window.speechSynthesis.cancel();

            // Advance to the quiz page that matches this run's video variant
            let v = 'A';
            try { v = localStorage.getItem('oceanx-variant') || 'A'; } catch (e) {}
            window.location.href = (v === 'B') ? "index4v2.html" : "index4.html";
        });
    }

    function registerSharkTrack() {
        internalCount++;
        counterScore.innerText = internalCount;
        
        counterScore.style.transform = 'scale(1.3)';
        counterScore.style.transition = 'transform 0.1s ease';
        setTimeout(() => {
            counterScore.style.transform = 'scale(1)';
        }, 100);
    }
}

// Global window fallback initialization rule for custom browser voices
if ('speechSynthesis' in window) {
    window.speechSynthesis.onvoiceschanged = () => { window.speechSynthesis.getVoices(); };
}
// ==========================================================================
// SECTION 4: INTERACTIVE QUIZ ENGINE CORE (index4.html Routing Functions)
// ==========================================================================
const feedbackBox = document.getElementById('feedback-box');

// Auto-speak question parameters on layout instantiation initialization
if (feedbackBox) {
    window.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            speakQuizQuestion("How many total sharks appeared in one frame? Choose your answer below!");
        }, 800);
    });
}

function speakQuizQuestion(text) {
    finSpeak('07-quiz-question.mp3', text, null);
}

let quizAnswered = false;   // resets on each page load
function checkQuizAnswer(selectedOption) {
    // Lock in the first answer — ignore any further clicks
    if (quizAnswered) return;
    quizAnswered = true;
    document.querySelectorAll('.btn-option').forEach(function (b) {
        b.disabled = true;
        b.style.pointerEvents = 'none';
        if (parseInt(b.textContent, 10) !== selectedOption) b.style.opacity = '0.45';
    });

    const correctAns = window.QUIZ_CORRECT || 7;   // set per page; defaults to 7

    // Remember the human's guess and the ML/true MaxN for the results screen (index6)
    try {
        localStorage.setItem('oceanx-human-count', selectedOption);
        localStorage.setItem('oceanx-ml-count', correctAns);
    } catch (e) {}

    let dynamicMessage = "";

    if (selectedOption === correctAns) {
        dynamicMessage = "That's correct! " + correctAns + " sharks appeared simultaneously in that one frame.";
        if (feedbackBox) feedbackBox.style.color = "#2e936b";
    } else {
        dynamicMessage = "Not quite! The answer is actually " + correctAns + "!";
        if (feedbackBox) feedbackBox.style.color = "#ff4b4b";
    }

    if (feedbackBox) feedbackBox.innerText = dynamicMessage;

    // Fin reacts: cheer for a correct answer, disappointed for a wrong one.
    // The override tells ocean-fx.js to keep this reaction playing while he speaks.
    const reactionClip = (selectedOption === correctAns) ? 'Cheer' : 'Disappointed';
    window.__finGestureOverride = reactionClip;
    const quizModel = document.querySelector('model-viewer');
    if (quizModel) {
        try { quizModel.animationName = reactionClip; if (quizModel.play) quizModel.play(); } catch (e) {}
    }

    // Fin's response, matched to the correct MaxN (7 = variant A, 9 = variant B)
    const audioFile = (selectedOption === correctAns)
        ? (correctAns === 9 ? '09-correct.mp3' : '08-correct.mp3')
        : (correctAns === 9 ? '11-wrong.mp3' : '10-wrong.mp3');

    // When Fin finishes, move on to page 5
    finSpeak(audioFile, dynamicMessage, function () {
        setTimeout(() => {
            window.location.href = "index5.html";
        }, 500);
    });
}

// ==========================================================================
// SECTION 5: AI DETECTION DISPLAY MODEL (index5.html Execution Hook)
// ==========================================================================
const modelBubble = document.getElementById('model-bubble');
const aiModelVideo = document.getElementById('ai-model-video');

const phaseFiveLines = [
    "With technological advancements, humans no longer need to manually count sharks, as AI-powered detection models can automatically identify and track them from underwater footage.",
    "The model uses You Only Look Once (YOLO) object detection to detect Blacktip reef sharks by drawing bounding boxes around them, displaying a confidence score for each detection, while an active counter and MaxN tracker record the number of sharks observed."
];
const phaseFiveAudio = ['12-ai.mp3', '13-ai.mp3'];
let phaseFiveIndex = 0;

if (modelBubble) {
    window.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            runPhaseFiveEngine();
        }, 800);
    });
}

function runPhaseFiveEngine() {
    if (phaseFiveIndex < phaseFiveLines.length) {
        const text = phaseFiveLines[phaseFiveIndex];
        
        // Directly replace the text inside the bubble (keeps text black naturally)
        modelBubble.innerText = text;

        finSpeak(phaseFiveAudio[phaseFiveIndex], text, function () {
            phaseFiveIndex++;
            if (phaseFiveIndex < phaseFiveLines.length) {
                setTimeout(() => {
                    runPhaseFiveEngine();
                }, 800);
            } else {
                // Lines finished -> play the AI vision model video, then go to summary
                if (aiModelVideo) {
                    aiModelVideo.play()
                        .then(() => {
                            aiModelVideo.addEventListener('ended', () => {
                                finCancel();
                                window.location.href = "index6.html";
                            });
                        })
                        .catch(err => console.log("Video track play blocked: ", err));
                }
            }
        });
    }
}
// ==========================================================================
// SECTION 6: MISSION SUMMARY ENGINE (index6.html Multi-Bubble Core)
// ==========================================================================
// ==========================================================================
// SECTION 6: MISSION SUMMARY ENGINE (Button Appears AFTER Voice Completes)
// ==========================================================================
const summarySpeechHolder = document.getElementById('summary-speech-holder');
const proceedMissionBtn = document.getElementById('proceed-mission-btn');

const summaryLines = [
    "Through Mission 1, you’ve learned how challenging and time-consuming manual shark counting can be. With the help of modern technology such as AI detection models, tracking sharks becomes faster, more accurate, and more efficient.",
    "Now, let’s move on to Mission 2, where we’ll explore how the ecosystem changes depending on the shark population using the Model Of The Sea."
];
const summaryAudio = ['14-summary.mp3', '15-summary.mp3'];
let summaryIndex = 0;

if (summarySpeechHolder) {
    window.addEventListener('DOMContentLoaded', () => {
        // Start running the voice/bubble generation routine
        setTimeout(() => {
            runSummaryEngine();
        }, 800);
    });
}
function runSummaryEngine() {
    if (summaryIndex < summaryLines.length) {
        const text = summaryLines[summaryIndex];

        // Create the new speech bubble card layer
        const bubble = document.createElement('div');
        bubble.className = "summary-bubble";
        bubble.innerText = text;
        
        // FIX: Append it directly to the end of the current visual stack.
        // It will stack beautifully and cleanly right above the hidden button!
        summarySpeechHolder.appendChild(bubble);

        finSpeak(summaryAudio[summaryIndex], text, function () {
            summaryIndex++;
            setTimeout(() => {
                runSummaryEngine();
            }, 700);
        });
    } else {
        // === ALL SPEECH FINISHED ===
        // Safely reveal the button right below the completed dialogue logs
        if (proceedMissionBtn) {
            proceedMissionBtn.style.display = "block";
            
            // Re-append it to the bottom of the container just in case DOM order shifted
            summarySpeechHolder.appendChild(proceedMissionBtn);
            
            proceedMissionBtn.addEventListener('click', () => {
                if ('speechSynthesis' in window) window.speechSynthesis.cancel();
                window.location.href = "https://euntnhii.github.io/Sharksphere-OCEANX/";
            });
        }
    }
}

// ==========================================================================
//  OFFBOARDING / END-OF-MISSION SCREEN (index7.html)
//  "Back to Start" button: clears this run's stored counts and returns to
//  the onboarding screen (index.html) for the next visitor.
// ==========================================================================
(function () {
    const restartBtn = document.getElementById("restart-btn");
    if (!restartBtn) return;

    // Fin salutes and speaks the closing line on load; ocean-fx.js watches
    // window.__finSpeaking and settles him into the Idle clip ~1.5s after the
    // audio ends. (In kiosk mode autoplay is allowed; otherwise it falls back
    // to TTS, which also drives __finSpeaking.)
    const closingLine = "We hope this experience has given you some valuable takeaways, and we look forward to seeing you again.";
    setTimeout(function () {
        finSpeak('ending.mp3', closingLine, null);
    }, 600);

    restartBtn.addEventListener("click", () => {
        finCancel();
        try {
            localStorage.removeItem("oceanx-human-count");
            localStorage.removeItem("oceanx-ml-count");
        } catch (e) {}
        window.location.href = "index.html";
    });
})();