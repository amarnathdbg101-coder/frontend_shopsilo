import React, { Component, ErrorInfo, ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { AlertTriangle, RefreshCw } from "lucide-react-native";
import { Button } from "@/components/Button";
import { getUserFriendlyError, logDeveloperErrorTelemetry } from "@/utils/error-sanitizer";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.log("[ErrorBoundary] Caught JS error:", error, errorInfo);
    logDeveloperErrorTelemetry(error, {
      requestPath: "ErrorBoundary_Component_Crash",
      userFriendlyMsg: "Dukaan screen me choti si samasya aayi hai. Try Again tap karein!",
    });
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      const userError = getUserFriendlyError(this.state.error);

      return (
        <View style={styles.container}>
          <View style={styles.content}>
            <View style={styles.iconCircle}>
              <AlertTriangle size={36} color="#ef4444" />
            </View>

            <Text style={styles.title}>
              {this.props.fallbackTitle || userError.title || "Dukaan System Notice"}
            </Text>

            <Text style={styles.description}>
              {userError.message || "Dukaan screen me choti si samasya aayi hai. Kripya Try Again tap karein!"}
            </Text>

            <Button
              title="Try Again ✨"
              size="md"
              onPress={this.handleReset}
              leftIcon={<RefreshCw size={16} color="#ffffff" />}
              style={styles.retryButton}
            />
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  content: {
    alignItems: "center",
    maxWidth: 320,
    width: "100%",
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#fee2e2",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 8,
    textAlign: "center",
  },
  description: {
    fontSize: 13,
    color: "#64748b",
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 18,
  },
  retryButton: {
    width: "100%",
  },
});
