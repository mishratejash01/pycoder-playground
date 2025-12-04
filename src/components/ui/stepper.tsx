import React, { useState, Children, HTMLAttributes, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronRight, ChevronLeft, Terminal } from 'lucide-react';
import './stepper.css';
import { cn } from '@/lib/utils';

interface StepperProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  initialStep?: number;
  onStepChange?: (step: number) => void;
  onFinalStepCompleted?: () => void;
  stepCircleContainerClassName?: string;
  stepContainerClassName?: string;
  contentClassName?: string;
  footerClassName?: string;
  backButtonProps?: React.ButtonHTMLAttributes<HTMLButtonElement>;
  nextButtonProps?: React.ButtonHTMLAttributes<HTMLButtonElement>;
  backButtonText?: string;
  nextButtonText?: string;
  disableStepIndicators?: boolean;
  isNextDisabled?: boolean;
}

export default function Stepper({
  children,
  initialStep = 1,
  onStepChange = () => {},
  onFinalStepCompleted = () => {},
  stepCircleContainerClassName = '',
  stepContainerClassName = '',
  contentClassName = '',
  footerClassName = '',
  backButtonProps = {},
  nextButtonProps = {},
  backButtonText = 'BACK',
  nextButtonText = 'NEXT_STEP',
  disableStepIndicators = false,
  isNextDisabled = false,
  ...rest
}: StepperProps) {
  const [currentStep, setCurrentStep] = useState<number>(initialStep);
  const [direction, setDirection] = useState<number>(0);
  const stepsArray = Children.toArray(children);
  const totalSteps = stepsArray.length;
  const isLastStep = currentStep === totalSteps;

  const updateStep = (newStep: number) => {
    setCurrentStep(newStep);
    if (newStep > totalSteps) {
      onFinalStepCompleted();
    } else {
      onStepChange(newStep);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setDirection(-1);
      updateStep(currentStep - 1);
    }
  };

  const handleNext = () => {
    if (!isLastStep) {
      setDirection(1);
      updateStep(currentStep + 1);
    }
  };

  const handleComplete = () => {
    setDirection(1);
    updateStep(totalSteps + 1);
  };

  // Calculate progress for the connector line
  const progressPercentage = ((currentStep - 1) / (totalSteps - 1)) * 100;

  return (
    <div className="outer-container" {...rest}>
      <div className={`step-circle-container ${stepCircleContainerClassName}`}>
        
        {/* Indicators Row */}
        <div className={`step-indicator-row ${stepContainerClassName}`}>
          {/* Background Connector Line */}
          <div className="step-connector">
            <div 
              className="step-connector-fill" 
              style={{ width: `${Math.min(100, Math.max(0, progressPercentage))}%` }} 
            />
          </div>

          {stepsArray.map((_, index) => {
            const stepNumber = index + 1;
            return (
              <StepIndicator
                key={stepNumber}
                step={stepNumber}
                currentStep={currentStep}
                disableStepIndicators={disableStepIndicators}
                onClickStep={(clicked) => {
                  if (clicked < currentStep) {
                    setDirection(-1);
                    updateStep(clicked);
                  }
                }}
              />
            );
          })}
        </div>

        {/* Content Area with Slide Animation */}
        <div className={cn("step-content-default", contentClassName)}>
          <AnimatePresence initial={false} mode="wait" custom={direction}>
            <motion.div
              key={currentStep}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="w-full h-full"
            >
              {stepsArray[currentStep - 1]}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer Actions */}
        <div className={`footer-container ${footerClassName}`}>
          <div className={`footer-nav ${currentStep !== 1 ? 'spread' : 'end'}`}>
            {currentStep !== 1 && (
              <button
                onClick={handleBack}
                className="back-button group flex items-center gap-2"
                {...backButtonProps}
              >
                <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                {backButtonText}
              </button>
            )}
            
            <button 
              onClick={isLastStep ? handleComplete : handleNext} 
              className="next-button group gap-2" 
              disabled={isNextDisabled}
              {...nextButtonProps}
            >
              {isLastStep ? (
                <>EXECUTE <Terminal className="w-4 h-4 ml-1" /></>
              ) : (
                <>{nextButtonText} <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Animation Variants ---
const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 50 : -50,
    opacity: 0,
    filter: 'blur(4px)',
  }),
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1,
    filter: 'blur(0px)',
  },
  exit: (direction: number) => ({
    zIndex: 0,
    x: direction < 0 ? 50 : -50,
    opacity: 0,
    filter: 'blur(4px)',
  })
};

// --- Sub Components ---

export function Step({ children }: { children: ReactNode }) {
  return <div className="step-default flex flex-col gap-6 py-2 h-full">{children}</div>;
}

interface StepIndicatorProps {
  step: number;
  currentStep: number;
  onClickStep: (step: number) => void;
  disableStepIndicators?: boolean;
}

function StepIndicator({ step, currentStep, onClickStep, disableStepIndicators }: StepIndicatorProps) {
  const status = currentStep === step ? 'active' : currentStep > step ? 'complete' : 'inactive';

  return (
    <motion.div 
      onClick={() => !disableStepIndicators && onClickStep(step)} 
      className="step-indicator"
      whileHover={status === 'complete' ? { scale: 1.1 } : {}}
      whileTap={status === 'complete' ? { scale: 0.95 } : {}}
    >
      <motion.div
        initial={false}
        animate={status}
        variants={{
          inactive: { 
            backgroundColor: '#09090b', 
            borderColor: '#27272a', 
            color: '#52525b',
            scale: 1 
          },
          active: { 
            backgroundColor: '#09090b', 
            borderColor: '#8b5cf6', 
            color: '#8b5cf6',
            scale: 1.2,
            boxShadow: '0 0 15px rgba(139, 92, 246, 0.5)'
          },
          complete: { 
            backgroundColor: '#8b5cf6', 
            borderColor: '#8b5cf6', 
            color: '#ffffff',
            scale: 1 
          }
        }}
        className="step-indicator-inner"
      >
        {status === 'complete' ? (
          <Check className="w-4 h-4" strokeWidth={4} />
        ) : (
          <span className="step-number">{step}</span>
        )}
      </motion.div>
    </motion.div>
  );
}
