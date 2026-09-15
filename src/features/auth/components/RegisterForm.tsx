import React from "react";
import { StyleSheet, View } from "react-native";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, Lock, User, Phone } from "lucide-react-native";

import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import { registerSchema, RegisterFormData } from "@/features/auth/schemas";
import { useThemeColor } from "@/hooks/useThemeColor";

interface RegisterFormProps {
  onSubmit: (data: RegisterFormData) => void;
  isLoading: boolean;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({
  onSubmit,
  isLoading,
}) => {
  const { colors } = useThemeColor();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      full_name: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
    },
  });

  return (
    <View style={styles.form}>
      <Controller
        control={control}
        name="full_name"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            label="Full Name"
            placeholder="John Doe"
            autoCapitalize="words"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.full_name?.message}
            leftIcon={<User size={20} color={colors.textMuted} />}
          />
        )}
      />

      <Controller
        control={control}
        name="email"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            label="Email Address"
            placeholder="name@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.email?.message}
            leftIcon={<Mail size={20} color={colors.textMuted} />}
          />
        )}
      />

      <Controller
        control={control}
        name="phone"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            label="Phone Number (Optional)"
            placeholder="+91 9876543210"
            keyboardType="phone-pad"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.phone?.message}
            leftIcon={<Phone size={20} color={colors.textMuted} />}
          />
        )}
      />

      <Controller
        control={control}
        name="password"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            label="Password"
            placeholder="At least 6 characters"
            secureTextEntry
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.password?.message}
            leftIcon={<Lock size={20} color={colors.textMuted} />}
          />
        )}
      />

      <Controller
        control={control}
        name="confirmPassword"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            label="Confirm Password"
            placeholder="Repeat your password"
            secureTextEntry
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.confirmPassword?.message}
            leftIcon={<Lock size={20} color={colors.textMuted} />}
          />
        )}
      />

      {/* 💡 TWEAK HERE: Button label or style */}
      <Button
        title="Create Account"
        size="lg"
        isLoading={isLoading}
        onPress={handleSubmit(onSubmit)}
        style={styles.submitButton}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  form: {
    width: "100%",
  },
  submitButton: {
    marginTop: 12,
  },
});
