/**
 * ==========================================================================
 * UNIQLOCK Skeletal Dancer Engine (120 BPM Beat-Synced Vector Animation)
 * ==========================================================================
 */

class SkeletalDancer {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        
        this.resize();
        window.addEventListener('resize', () => this.resize());

        // Particle system for dance sparks
        this.particles = [];

        // Current dance animation state
        this.currentRoutineIndex = 0;
        this.beatProgress = 0; // 0 to 1 between beats
        this.currentBeatIndex = 0;
        
        // Define base poses
        this.initializePoses();
        
        // Active routine
        this.routines = [
            this.createDiscoRoutine(),
            this.createRunningManRoutine(),
            this.createSideStepRoutine(),
            this.createRoboRoutine(),
            this.createJumpingJackRoutine()
        ];
    }

    resize() {
        // Set internal resolution matching parent element size
        const rect = this.canvas.parentElement.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
    }

    // Initialize poses relative to the Hip Center (0, 0)
    initializePoses() {
        this.poses = {
            // Pose 0: T-Pose / Standby
            standby: {
                hip: {x: 0, y: 10}, neck: {x: 0, y: -75}, head: {x: 0, y: -105},
                shoulderL: {x: -30, y: -65}, shoulderR: {x: 30, y: -65},
                elbowL: {x: -60, y: -50}, elbowR: {x: 60, y: -50},
                handL: {x: -85, y: -30}, handR: {x: 85, y: -30},
                hipL: {x: -15, y: 10}, hipR: {x: 15, y: 10},
                kneeL: {x: -15, y: 55}, kneeR: {x: 15, y: 55},
                footL: {x: -15, y: 100}, footR: {x: 15, y: 100}
            },
            
            // Poses for Disco Routine
            discoLeftUp: {
                hip: {x: 10, y: 15}, neck: {x: 2, y: -70}, head: {x: 5, y: -100},
                shoulderL: {x: -25, y: -65}, shoulderR: {x: 35, y: -60},
                elbowL: {x: -60, y: -90}, elbowR: {x: 50, y: -30},
                handL: {x: -90, y: -120}, handR: {x: 50, y: 5},
                hipL: {x: -10, y: 15}, hipR: {x: 20, y: 15},
                kneeL: {x: -20, y: 55}, kneeR: {x: 10, y: 65},
                footL: {x: -25, y: 95}, footR: {x: 10, y: 105}
            },
            discoRightUp: {
                hip: {x: -10, y: 15}, neck: {x: -2, y: -70}, head: {x: -5, y: -100},
                shoulderL: {x: -35, y: -60}, shoulderR: {x: 25, y: -65},
                elbowL: {x: -50, y: -30}, elbowR: {x: 60, y: -90},
                handL: {x: -50, y: 5}, handR: {x: 90, y: -120},
                hipL: {x: -20, y: 15}, hipR: {x: 10, y: 15},
                kneeL: {x: -10, y: 65}, kneeR: {x: 20, y: 55},
                footL: {x: -10, y: 105}, footR: {x: 25, y: 95}
            },

            // Poses for Running Man
            runStep1: {
                hip: {x: 0, y: 0}, neck: {x: -5, y: -75}, head: {x: -8, y: -105},
                shoulderL: {x: -25, y: -70}, shoulderR: {x: 25, y: -70},
                elbowL: {x: -5, y: -45}, elbowR: {x: 45, y: -40},
                handL: {x: 10, y: -15}, handR: {x: 35, y: -10},
                hipL: {x: -15, y: 0}, hipR: {x: 15, y: 0},
                kneeL: {x: -35, y: 35}, kneeR: {x: 30, y: 15},
                footL: {x: -45, y: 70}, footR: {x: 35, y: 55}
            },
            runStep2: {
                hip: {x: 0, y: -20}, neck: {x: 0, y: -90}, head: {x: 0, y: -120},
                shoulderL: {x: -30, y: -80}, shoulderR: {x: 30, y: -80},
                elbowL: {x: -45, y: -60}, elbowR: {x: -10, y: -60},
                handL: {x: -50, y: -35}, handR: {x: 5, y: -30},
                hipL: {x: -15, y: -10}, hipR: {x: 15, y: -10},
                kneeL: {x: -30, y: 25}, kneeR: {x: 40, y: -10},
                footL: {x: -30, y: 65}, footR: {x: 40, y: 25}
            },
            runStep3: {
                hip: {x: 0, y: 0}, neck: {x: 5, y: -75}, head: {x: 8, y: -105},
                shoulderL: {x: -25, y: -70}, shoulderR: {x: 25, y: -70},
                elbowL: {x: -45, y: -40}, elbowR: {x: 5, y: -45},
                handL: {x: -35, y: -10}, handR: {x: -10, y: -15},
                hipL: {x: -15, y: 0}, hipR: {x: 15, y: 0},
                kneeL: {x: -30, y: 15}, kneeR: {x: 35, y: 35},
                footL: {x: -35, y: 55}, footR: {x: 45, y: 70}
            },
            runStep4: {
                hip: {x: 0, y: -20}, neck: {x: 0, y: -90}, head: {x: 0, y: -120},
                shoulderL: {x: -30, y: -80}, shoulderR: {x: 30, y: -80},
                elbowL: {x: 10, y: -60}, elbowR: {x: 45, y: -60},
                handL: {x: -5, y: -30}, handR: {x: 50, y: -35},
                hipL: {x: -15, y: -10}, hipR: {x: 15, y: -10},
                kneeL: {x: -40, y: -10}, kneeR: {x: 30, y: 25},
                footL: {x: -40, y: 25}, footR: {x: 30, y: 65}
            },

            // Poses for Side Step
            sideLeft: {
                hip: {x: -35, y: 10}, neck: {x: -30, y: -65}, head: {x: -25, y: -95},
                shoulderL: {x: -60, y: -55}, shoulderR: {x: 0, y: -65},
                elbowL: {x: -80, y: -30}, elbowR: {x: 10, y: -35},
                handL: {x: -70, y: -5}, handR: {x: 30, y: -15},
                hipL: {x: -45, y: 10}, hipR: {x: -20, y: 10},
                kneeL: {x: -50, y: 55}, kneeR: {x: -10, y: 55},
                footL: {x: -55, y: 100}, footR: {x: 0, y: 100}
            },
            sideRight: {
                hip: {x: 35, y: 10}, neck: {x: 30, y: -65}, head: {x: 25, y: -95},
                shoulderL: {x: 0, y: -65}, shoulderR: {x: 60, y: -55},
                elbowL: {x: -10, y: -35}, elbowR: {x: 80, y: -30},
                handL: {x: -30, y: -15}, handR: {x: 70, y: -5},
                hipL: {x: 20, y: 10}, hipR: {x: 45, y: 10},
                kneeL: {x: 10, y: 55}, kneeR: {x: 50, y: 55},
                footL: {x: 0, y: 100}, footR: {x: 55, y: 100}
            },

            // Poses for Robo
            roboPose1: {
                hip: {x: 0, y: 5}, neck: {x: 0, y: -70}, head: {x: 5, y: -100},
                shoulderL: {x: -30, y: -65}, shoulderR: {x: 30, y: -65},
                elbowL: {x: -60, y: -65}, elbowR: {x: 30, y: -35},
                handL: {x: -60, y: -95}, handR: {x: 60, y: -35},
                hipL: {x: -15, y: 5}, hipR: {x: 15, y: 5},
                kneeL: {x: -15, y: 50}, kneeR: {x: 15, y: 50},
                footL: {x: -15, y: 95}, footR: {x: 15, y: 95}
            },
            roboPose2: {
                hip: {x: 5, y: 5}, neck: {x: 5, y: -70}, head: {x: -5, y: -100},
                shoulderL: {x: -25, y: -65}, shoulderR: {x: 35, y: -65},
                elbowL: {x: -25, y: -35}, elbowR: {x: 65, y: -65},
                handL: {x: -25, y: -5}, handR: {x: 65, y: -95},
                hipL: {x: -10, y: 5}, hipR: {x: 20, y: 5},
                kneeL: {x: -20, y: 50}, kneeR: {x: 10, y: 50},
                footL: {x: -25, y: 95}, footR: {x: 10, y: 95}
            },
            roboPose3: {
                hip: {x: -5, y: 5}, neck: {x: -5, y: -70}, head: {x: -5, y: -100},
                shoulderL: {x: -35, y: -65}, shoulderR: {x: 25, y: -65},
                elbowL: {x: -65, y: -65}, elbowR: {x: 25, y: -35},
                handL: {x: -95, y: -65}, handR: {x: 25, y: 5},
                hipL: {x: -20, y: 5}, hipR: {x: 10, y: 5},
                kneeL: {x: -10, y: 50}, kneeR: {x: 20, y: 50},
                footL: {x: -10, y: 95}, footR: {x: 25, y: 95}
            },

            // Poses for Jumping Jack
            jackSpread: {
                hip: {x: 0, y: -15}, neck: {x: 0, y: -90}, head: {x: 0, y: -120},
                shoulderL: {x: -30, y: -80}, shoulderR: {x: 30, y: -80},
                elbowL: {x: -70, y: -120}, elbowR: {x: 70, y: -120},
                handL: {x: -100, y: -150}, handR: {x: 100, y: -150},
                hipL: {x: -15, y: -10}, hipR: {x: 15, y: -10},
                kneeL: {x: -45, y: 35}, kneeR: {x: 45, y: 35},
                footL: {x: -70, y: 75}, footR: {x: 70, y: 75}
            },
            jackTogether: {
                hip: {x: 0, y: 15}, neck: {x: 0, y: -65}, head: {x: 0, y: -95},
                shoulderL: {x: -25, y: -60}, shoulderR: {x: 25, y: -60},
                elbowL: {x: -35, y: -25}, elbowR: {x: 35, y: -25},
                handL: {x: -40, y: 10}, handR: {x: 40, y: 10},
                hipL: {x: -10, y: 15}, hipR: {x: 10, y: 15},
                kneeL: {x: -10, y: 60}, kneeR: {x: 10, y: 60},
                footL: {x: -10, y: 105}, footR: {x: 10, y: 105}
            }
        };
    }

    // Build routines by listing sequence of poses (synced with beat)
    createDiscoRoutine() {
        return [
            this.poses.discoLeftUp,
            this.poses.standby,
            this.poses.discoRightUp,
            this.poses.standby
        ];
    }

    createRunningManRoutine() {
        return [
            this.poses.runStep1,
            this.poses.runStep2,
            this.poses.runStep3,
            this.poses.runStep4
        ];
    }

    createSideStepRoutine() {
        return [
            this.poses.sideLeft,
            this.poses.standby,
            this.poses.sideRight,
            this.poses.standby
        ];
    }

    createRoboRoutine() {
        return [
            this.poses.roboPose1,
            this.poses.roboPose2,
            this.poses.roboPose3,
            this.poses.standby
        ];
    }

    createJumpingJackRoutine() {
        return [
            this.poses.jackSpread,
            this.poses.jackTogether,
            this.poses.jackSpread,
            this.poses.jackTogether
        ];
    }

    // Call to transition to a new routine (randomly or sequentially)
    changeRoutine() {
        let nextIndex;
        do {
            nextIndex = Math.floor(Math.random() * this.routines.length);
        } while (nextIndex === this.currentRoutineIndex && this.routines.length > 1);
        
        this.currentRoutineIndex = nextIndex;
    }

    // Custom Spring Easing (gives a "snappy" bounce on beat transitions)
    easeOutBack(x) {
        const c1 = 1.70158;
        const c3 = c1 + 1;
        return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
    }

    // Quick snap interpolation
    snapEase(x) {
        // Move rapidly in the first 50% of the beat window, then ease out
        if (x < 0.4) {
            return Math.pow(x / 0.4, 2) * 0.8;
        } else {
            return 0.8 + (x - 0.4) / 0.6 * 0.2;
        }
    }

    // Get interpolated joint coordinate at a specific beat position
    interpolateJoint(fromJoint, toJoint, t) {
        return {
            x: fromJoint.x + (toJoint.x - fromJoint.x) * t,
            y: fromJoint.y + (toJoint.y - fromJoint.y) * t
        };
    }

    // Interpolates between two complete poses
    interpolatePoses(poseA, poseB, progress) {
        // Apply snappy beat easing
        const t = this.easeOutBack(progress);
        const result = {};
        
        for (const joint in poseA) {
            result[joint] = this.interpolateJoint(poseA[joint], poseB[joint], t);
        }
        return result;
    }

    // Spawn sparks/particles on movements
    spawnParticles(x, y, color) {
        for (let i = 0; i < 3; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 4,
                vy: (Math.random() - 0.5) * 4 - 2,
                size: Math.random() * 3 + 2,
                alpha: 1,
                life: 1.0,
                decay: Math.random() * 0.04 + 0.02,
                color: color
            });
        }
    }

    updateParticles() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.08; // gravity
            p.alpha -= p.decay;
            if (p.alpha <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }

    drawParticles() {
        this.particles.forEach(p => {
            this.ctx.save();
            this.ctx.globalAlpha = p.alpha;
            this.ctx.fillStyle = p.color;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
        });
    }

    // Draw lines connecting joints to build limbs
    drawBone(pose, jointA, jointB, color, thickness) {
        const ptA = pose[jointA];
        const ptB = pose[jointB];
        
        // Scale and translate relative to Canvas center
        const cx = this.canvas.width / 2 + this.canvas.width * 0.005;
        const cy = this.canvas.height / 2 + 30; // Shift down slightly to center vertically with legs
        
        const scale = Math.min(this.canvas.width, this.canvas.height) / 280;

        const x1 = cx + ptA.x * scale;
        const y1 = cy + ptA.y * scale;
        const x2 = cx + ptB.x * scale;
        const y2 = cy + ptB.y * scale;

        this.ctx.beginPath();
        this.ctx.moveTo(x1, y1);
        this.ctx.lineTo(x2, y2);
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = thickness * scale;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        this.ctx.stroke();

        // Emit particles at hands/feet if beat is peaking
        if (this.beatProgress < 0.15 && (jointB === 'handL' || jointB === 'handR' || jointB === 'footL' || jointB === 'footR')) {
            if (Math.random() < 0.3) {
                this.spawnParticles(x2, y2, color);
            }
        }
    }

    // Draw the head of the dancer
    drawHead(pose, color) {
        const neck = pose.neck;
        const head = pose.head;
        
        const cx = this.canvas.width / 2;
        const cy = this.canvas.height / 2 + 30;
        const scale = Math.min(this.canvas.width, this.canvas.height) / 280;

        const x = cx + head.x * scale;
        const y = cy + head.y * scale;
        const radius = 16 * scale;

        // Draw head circle
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, 0, Math.PI * 2);
        this.ctx.fillStyle = color;
        this.ctx.fill();

        // Draw simple eyes/features for stylistic look if close
        this.ctx.beginPath();
        this.ctx.arc(cx + neck.x * scale, cy + neck.y * scale, 5 * scale, 0, Math.PI * 2);
        this.ctx.fillStyle = color;
        this.ctx.fill();
    }

    // Main render frame called from script.js animation loop
    render(beatCount, themeColorCode) {
        // Setup drawing context
        this.ctx.fillStyle = '#0c0c0e'; // Deep black background
        // Semi-clear for trailing / shadow echoes
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Get beat progress and current pose sequence
        const routine = this.routines[this.currentRoutineIndex];
        const totalSteps = routine.length;
        
        const stepFloat = beatCount % totalSteps;
        this.currentBeatIndex = Math.floor(stepFloat);
        this.beatProgress = stepFloat - this.currentBeatIndex;

        const nextBeatIndex = (this.currentBeatIndex + 1) % totalSteps;

        const poseA = routine[this.currentBeatIndex];
        const poseB = routine[nextBeatIndex];

        // Interpolate between the current pose and the next pose
        const currentPose = this.interpolatePoses(poseA, poseB, this.beatProgress);

        // Determine drawing colors
        const dancerColor = '#ffffff';
        const shadowColor = themeColorCode || '#E60012'; // Glowing theme outline

        // 1. Draw glowing background shadow skeleton (larger offset/blur)
        this.ctx.shadowColor = shadowColor;
        this.ctx.shadowBlur = 15;
        this.drawSkeleton(currentPose, shadowColor, 10);
        
        // 2. Draw sharp white foreground skeleton
        this.ctx.shadowBlur = 0; // reset blur
        this.drawSkeleton(currentPose, dancerColor, 5);

        // 3. Draw head
        this.drawHead(currentPose, dancerColor);

        // 4. Update and draw particles
        this.updateParticles();
        this.drawParticles();
    }

    drawSkeleton(pose, color, thickness) {
        // Center Spine & Head connection
        this.drawBone(pose, 'hip', 'neck', color, thickness);
        
        // Arms
        this.drawBone(pose, 'neck', 'shoulderL', color, thickness);
        this.drawBone(pose, 'shoulderL', 'elbowL', color, thickness);
        this.drawBone(pose, 'elbowL', 'handL', color, thickness);

        this.drawBone(pose, 'neck', 'shoulderR', color, thickness);
        this.drawBone(pose, 'shoulderR', 'elbowR', color, thickness);
        this.drawBone(pose, 'elbowR', 'handR', color, thickness);

        // Pelvis & Legs
        this.drawBone(pose, 'hip', 'hipL', color, thickness);
        this.drawBone(pose, 'hipL', 'kneeL', color, thickness);
        this.drawBone(pose, 'kneeL', 'footL', color, thickness);

        this.drawBone(pose, 'hip', 'hipR', color, thickness);
        this.drawBone(pose, 'hipR', 'kneeR', color, thickness);
        this.drawBone(pose, 'kneeR', 'footR', color, thickness);
    }
}
window.SkeletalDancer = SkeletalDancer;
