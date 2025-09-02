/**
 * Speed Insights and Web Vitals tracking
 * Integrates with Vercel Speed Insights and custom performance monitoring
 */

import { onCLS, onFCP, onINP, onLCP, onTTFB } from 'web-vitals';
import type { CLSMetric, FCPMetric, INPMetric, LCPMetric, TTFBMetric } from 'web-vitals';

export interface WebVitalsMetric {
  id: string;
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  navigationType: string;
  timestamp: number;
}

export interface SpeedInsightData {
  metrics: WebVitalsMetric[];
  pageUrl: string;
  userAgent: string;
  connectionType?: string;
  deviceMemory?: number;
  timestamp: number;
  sessionId: string;
}

class SpeedInsightsService {
  private sessionId: string;
  private metrics: WebVitalsMetric[] = [];
  private isEnabled: boolean;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.isEnabled = typeof window !== 'undefined';

    if (this.isEnabled) {
      this.initializeWebVitals();
      this.trackNetworkInfo();
    }
  }

  private generateSessionId(): string {
    return `speed_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private initializeWebVitals() {
    // Track Core Web Vitals
    onCLS(this.handleMetric.bind(this));
    onFCP(this.handleMetric.bind(this));
    onINP(this.handleMetric.bind(this));
    onLCP(this.handleMetric.bind(this));
    onTTFB(this.handleMetric.bind(this));
  }

  private handleMetric(metric: CLSMetric | FCPMetric | INPMetric | LCPMetric | TTFBMetric) {
    const webVitalsMetric: WebVitalsMetric = {
      id: metric.id,
      name: metric.name,
      value: metric.value,
      rating: metric.rating,
      navigationType: metric.navigationType,
      timestamp: Date.now(),
    };

    this.metrics.push(webVitalsMetric);
    this.reportMetric(webVitalsMetric);

    // Log performance issues
    if (metric.rating === 'poor') {
      console.warn(`🐌 Poor ${metric.name} performance:`, metric.value);
    }
  }

  private trackNetworkInfo() {
    // Track network connection info if available
    const connection =
      (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;

    if (connection) {
      console.log('📶 Network Info:', {
        effectiveType: connection.effectiveType,
        downlink: connection.downlink,
        rtt: connection.rtt,
        saveData: connection.saveData,
      });
    }
  }

  private reportMetric(metric: WebVitalsMetric) {
    // Send to monitoring endpoint
    if (process.env.NODE_ENV === 'production') {
      this.sendToAnalytics(metric);
    }

    // Log in development
    if (process.env.NODE_ENV === 'development') {
      console.log('⚡ Speed Insight:', metric);
    }
  }

  private async sendToAnalytics(metric: WebVitalsMetric) {
    try {
      const speedData: SpeedInsightData = {
        metrics: [metric],
        pageUrl: window.location.href,
        userAgent: navigator.userAgent,
        connectionType: this.getConnectionType(),
        deviceMemory: this.getDeviceMemory(),
        timestamp: Date.now(),
        sessionId: this.sessionId,
      };

      await fetch('/api/monitoring/speed-insights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(speedData),
      });
    } catch (error) {
      console.warn('Failed to send speed insights:', error);
    }
  }

  private getConnectionType(): string | undefined {
    const connection =
      (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    return connection?.effectiveType;
  }

  private getDeviceMemory(): number | undefined {
    return (navigator as any).deviceMemory;
  }

  // Get current metrics
  getMetrics(): WebVitalsMetric[] {
    return [...this.metrics];
  }

  // Get metrics summary
  getMetricsSummary() {
    const summary = {
      totalMetrics: this.metrics.length,
      goodMetrics: this.metrics.filter((m) => m.rating === 'good').length,
      needsImprovementMetrics: this.metrics.filter((m) => m.rating === 'needs-improvement').length,
      poorMetrics: this.metrics.filter((m) => m.rating === 'poor').length,
      sessionId: this.sessionId,
      lastMetric: this.metrics.length > 0 ? this.metrics[this.metrics.length - 1] : null,
    };

    return summary;
  }

  // Get performance score (0-100)
  getPerformanceScore(): number {
    if (this.metrics.length === 0) return 100;

    const weights = {
      good: 100,
      'needs-improvement': 60,
      poor: 20,
    };

    const totalScore = this.metrics.reduce((sum, metric) => {
      return sum + weights[metric.rating];
    }, 0);

    return Math.round(totalScore / this.metrics.length);
  }

  // Clear stored metrics
  clearMetrics() {
    this.metrics = [];
  }

  // Track custom performance metrics
  trackCustomMetric(name: string, value: number, unit: string = 'ms') {
    const customMetric: WebVitalsMetric = {
      id: `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: `custom_${name}`,
      value,
      rating: this.calculateRating(name, value),
      navigationType: 'custom',
      timestamp: Date.now(),
    };

    this.metrics.push(customMetric);
    this.reportMetric(customMetric);

    if (process.env.NODE_ENV === 'development') {
      console.log(`📊 Custom Metric: ${name} = ${value}${unit}`);
    }
  }

  private calculateRating(metricName: string, value: number): 'good' | 'needs-improvement' | 'poor' {
    // Simple thresholds for custom metrics
    const thresholds = {
      loadTime: { good: 1000, poor: 3000 },
      renderTime: { good: 500, poor: 1500 },
      apiCall: { good: 500, poor: 2000 },
      interaction: { good: 100, poor: 300 },
    };

    const threshold = thresholds[metricName as keyof typeof thresholds] || { good: 1000, poor: 3000 };

    if (value <= threshold.good) return 'good';
    if (value <= threshold.poor) return 'needs-improvement';
    return 'poor';
  }
}

// Singleton instance
export const speedInsights = new SpeedInsightsService();

// React hook for speed insights
export function useSpeedInsights() {
  return {
    getMetrics: speedInsights.getMetrics.bind(speedInsights),
    getMetricsSummary: speedInsights.getMetricsSummary.bind(speedInsights),
    getPerformanceScore: speedInsights.getPerformanceScore.bind(speedInsights),
    trackCustomMetric: speedInsights.trackCustomMetric.bind(speedInsights),
    clearMetrics: speedInsights.clearMetrics.bind(speedInsights),
  };
}

export default speedInsights;
