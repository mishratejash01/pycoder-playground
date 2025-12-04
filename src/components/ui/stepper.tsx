import React, { useState, Children, useLayoutEffect, HTMLAttributes, ReactNode } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { Check } from 'lucide-react';
import './stepper.css';

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
  renderStepIndicator?: (props: RenderStepIndicatorProps) => ReactNode;
  isNextDisabled?: boolean;
}

interface RenderStepIndicatorProps {
  step: number;
  currentStep: number;
  onStepClick: (clicked: number) => void;
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
  backButtonText = 'Back',
  nextButtonText = 'Continue',
  disableStepIndicators = false,
  renderStepIndicator,
  isNextDisabled = false,
  ...rest
}: StepperProps) {
  const [currentStep, setCurrentStep] = useState<number>(initialStep);
  const [direction, setDirection] = useState<number>(0);
  const stepsArray = Children.toArray(children);
  const totalSteps = stepsArray.length;
  const isCompleted = currentStep > totalSteps;
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

  return (
    <div className="outer-container" {...rest}>
      <div className={`step-circle-container ${stepCircleContainerClassName}`}>
        {/* Indicators Row */}
        <div className={`step-indicator-row ${stepContainerClassName}`}>
          {stepsArray.map((_, index) => {
            const stepNumber = index + 1;
            const isNotLastStep = index < totalSteps - 1;
            return (
              <React.Fragment key={stepNumber}>
                {renderStepIndicator ? (
                  renderStepIndicator({
                    step: stepNumber,
                    currentStep,
                    onStepClick: clicked => {
                      setDirection(clicked > currentStep ? 1 : -1);
                      updateStep(clicked);
                    }
                  })
                ) : (
                  <StepIndicator
                    step={stepNumber}
                    disableStepIndicators={disableStepIndicators}
                    currentStep={currentStep}
                    onClickStep={clicked => {
                      if (clicked < currentStep) {
                        setDirection(-1);
                        updateStep(clicked);
                      }
                    }}
                  />
                )}
                {isNotLastStep && <StepConnector isComplete={currentStep > stepNumber} />}
              </React.Fragment>
            );
          })}
        </div>

        {/* Content Area */}
        <StepContentWrapper
          isCompleted={isCompleted}
          currentStep={currentStep}
          direction={direction}
          className={`step-content-default ${contentClassName}`}
        >
          {stepsArray[currentStep - 1]}
        </StepContentWrapper>

        {/* Footer Actions */}
        {!isCompleted && (
          <div className={`footer-container ${footerClassName}`}>
            <div className={`footer-nav ${currentStep !== 1 ? 'spread' : 'end'}`}>
              <button
                onClick={handleBack}
                className={`back-button ${currentStep === 1 ? 'inactive' : ''}`}
                disabled={currentStep === 1}
                {...backButtonProps}
              >
                {backButtonText}
              </button>
              
              <button 
                onClick={isLastStep ? handleComplete : handleNext} 
                className="next-button" 
                disabled={isNextDisabled}
                {...nextButtonProps}
              >
                {isLastStep ? 'Complete Profile' : nextButtonText}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// --- Sub Components ---

interface StepContentWrapperProps {
  isCompleted: boolean;
  currentStep: number;
  direction: number;
  children: ReactNode;
  className?: string;
}

function StepContentWrapper({ isCompleted, currentStep, direction, children, className }: StepContentWrapperProps) {
  return (
    <div className={className} style={{ position: 'relative', overflow: 'visible', display: 'flex', flexDirection: 'column' }}>
      <AnimatePresence initial={false} mode="wait" custom={direction}>
        {!isCompleted && (
          <SlideTransition key={currentStep} direction={direction}>
            {children}
          </SlideTransition>
        )}
      </AnimatePresence>
    </div>
  );
}

interface SlideTransitionProps {
  children: ReactNode;
  direction: number;
}

function SlideTransition({ children, direction }: SlideTransitionProps) {
  return (
    <motion.div
      custom={direction}
      variants={stepVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="w-full flex-1"
    >
      {children}
    </motion.div>
  );
}

const stepVariants: Variants = {
  enter: (dir: number) => ({
    x: dir >= 0 ? 20 : -20,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (dir: number) => ({
    x: dir >= 0 ? -20 : 20,
    opacity: 0,
  })
};

export function Step({ children }: { children: ReactNode }): JSX.Element {
  return <div className="step-default flex flex-col gap-5 py-2">{children}</div>;
}

// --- Indicators & Connectors ---

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
            backgroundColor: 'rgba(255,255,255,0.03)', 
            borderColor: 'rgba(255,255,255,0.1)', 
            color: '#71717a',
            scale: 1 
          },
          active: { 
            backgroundColor: '#7c3aed', 
            borderColor: '#8b5cf6', 
            color: '#ffffff',
            scale: 1.1,
            boxShadow: '0 0 0 4px rgba(124, 58, 237, 0.2)' 
          },
          complete: { 
            backgroundColor: '#10b981', // Emerald green for complete
            borderColor: '#10b981', 
            color: '#ffffff',
            scale: 1 
          }
        }}
        className="step-indicator-inner border-2"
      >
        {status === 'complete' ? (
          <Check className="w-5 h-5" strokeWidth={3} />
        ) : (
          <span className="step-number">{step}</span>
        )}
      </motion.div>
    </motion.div>
  );
}

interface StepConnectorProps {
  isComplete: boolean;
}

function StepConnector({ isComplete }: StepConnectorProps) {
  return (
    <div className="step-connector">
      <div 
        className="step-connector-inner"
        style={{ width: isComplete ? '100%' : '0%' }}
      />
    </div>
  );
}
