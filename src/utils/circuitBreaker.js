/**
 * Circuit Breaker Pattern Implementation
 * 
 * Prevents cascade failures by failing fast when error thresholds are exceeded.
 * Three states: CLOSED (normal), OPEN (failing fast), HALF_OPEN (testing recovery)
 */

const CircuitState = {
  CLOSED: 'closed',       // Normal operation
  OPEN: 'open',           // Failing fast
  HALF_OPEN: 'half_open'  // Testing if service recovered
};

class CircuitBreaker {
  constructor(options = {}) {
    this.name = options?.name || 'default';
    this.failureThreshold = options?.failureThreshold || 5;
    this.successThreshold = options?.successThreshold || 2;
    this.timeout = options?.timeout || 60000; // 60 seconds
    this.monitoringPeriod = options?.monitoringPeriod || 10000; // 10 seconds
    
    this.state = CircuitState?.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.nextAttempt = Date.now();
    this.lastFailureTime = null;
    this.stateChangeListeners = [];
  }

  async execute(operation, fallback = null) {
    if (this.state === CircuitState?.OPEN) {
      if (Date.now() < this.nextAttempt) {
        console.warn(`[CircuitBreaker:${this.name}] Circuit OPEN, failing fast`);
        
        if (fallback) {
          return await fallback();
        }
        
        const error = new Error(`Circuit breaker is OPEN for ${this.name}`);
        error.circuitBreakerOpen = true;
        throw error;
      }
      
      // Timeout expired, try half-open
      this.transitionTo(CircuitState?.HALF_OPEN);
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  onSuccess() {
    this.failureCount = 0;
    
    if (this.state === CircuitState?.HALF_OPEN) {
      this.successCount++;
      
      if (this.successCount >= this.successThreshold) {
        console.log(`[CircuitBreaker:${this.name}] Service recovered, closing circuit`);
        this.transitionTo(CircuitState?.CLOSED);
        this.successCount = 0;
      }
    }
  }

  onFailure() {
    this.lastFailureTime = Date.now();
    this.failureCount++;
    this.successCount = 0;
    
    if (this.state === CircuitState?.HALF_OPEN) {
      console.warn(`[CircuitBreaker:${this.name}] Failure in HALF_OPEN, reopening circuit`);
      this.transitionTo(CircuitState?.OPEN);
      return;
    }
    
    if (this.failureCount >= this.failureThreshold) {
      console.error(`[CircuitBreaker:${this.name}] Failure threshold exceeded, opening circuit`);
      this.transitionTo(CircuitState?.OPEN);
    }
  }

  transitionTo(newState) {
    const oldState = this.state;
    this.state = newState;
    
    if (newState === CircuitState?.OPEN) {
      this.nextAttempt = Date.now() + this.timeout;
    }
    
    console.log(`[CircuitBreaker:${this.name}] State transition: ${oldState} → ${newState}`);
    
    // Notify listeners
    this.stateChangeListeners?.forEach(listener => {
      try {
        listener(newState, oldState, this.name);
      } catch (error) {
        console.error(`[CircuitBreaker:${this.name}] Error in state change listener:`, error);
      }
    });
  }

  onStateChange(callback) {
    this.stateChangeListeners?.push(callback);
    return () => {
      this.stateChangeListeners = this.stateChangeListeners?.filter(cb => cb !== callback);
    };
  }

  getState() {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      nextAttempt: this.nextAttempt,
      lastFailureTime: this.lastFailureTime,
      isOpen: this.state === CircuitState?.OPEN,
      isHalfOpen: this.state === CircuitState?.HALF_OPEN,
      isClosed: this.state === CircuitState?.CLOSED
    };
  }

  reset() {
    console.log(`[CircuitBreaker:${this.name}] Manual reset`);
    this.state = CircuitState?.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.nextAttempt = Date.now();
    this.lastFailureTime = null;
  }
}

// Global circuit breakers for different services
const circuitBreakers = new Map();

export const getCircuitBreaker = (name, options = {}) => {
  if (!circuitBreakers?.has(name)) {
    circuitBreakers?.set(name, new CircuitBreaker({ ...options, name }));
  }
  return circuitBreakers?.get(name);
};

export const resetCircuitBreaker = (name) => {
  const breaker = circuitBreakers?.get(name);
  if (breaker) {
    breaker?.reset();
  }
};

export const resetAllCircuitBreakers = () => {
  circuitBreakers?.forEach(breaker => breaker?.reset());
};

export const getAllCircuitBreakerStates = () => {
  const states = {};
  circuitBreakers?.forEach((breaker, name) => {
    states[name] = breaker?.getState();
  });
  return states;
};

export { CircuitState };
export default CircuitBreaker;
