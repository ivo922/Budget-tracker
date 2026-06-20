import React from 'react';
import { View } from 'react-native';
import { Text, TextInput } from 'react-native-paper';
import { FormDatePicker } from '@/components/FormDatePicker';
import { FormFieldButton } from '@/components/FormFieldButton';
import { FormFieldGroup } from '@/components/FormFieldGroup';
import { FormFieldSwitch } from '@/components/FormFieldSwitch';
import { FormHelperText } from '@/components/FormHelperText';
import { FormSection } from '@/components/FormSection';
import { FormTextInput } from '@/components/FormTextInput';
import { InlineSelect } from '@/components/InlineSelect';
import { TransactionTypeSelector } from '@/components/TransactionTypeSelector';
import type { useTransactionForm } from '@/hooks/useTransactionForm';
import { formatGoalType } from '@/lib/format';
import { layoutStyles } from '@/lib/layout';
import { useErrorStyle, useAppTheme } from '@/lib/useAppTheme';

type FormState = ReturnType<typeof useTransactionForm>;

type Props = {
  form: FormState;
  mode: 'add' | 'edit';
};

export function TransactionFormFields({ form, mode }: Props) {
  const theme = useAppTheme();
  const errorStyle = useErrorStyle();
  const {
    type,
    setType,
    amount,
    setAmount,
    note,
    setNote,
    date,
    paid,
    setPaid,
    showDatePicker,
    setShowDatePicker,
    accountOptions,
    accountId,
    setAccountId,
    fromAccountId,
    setFromAccountId,
    toAccountId,
    setToAccountId,
    parentCategories,
    subcategories,
    parentCategoryId,
    setParentCategoryId,
    categoryId,
    setCategoryId,
    goalId,
    setGoalId,
    autoLinkedGoal,
    manualGoalOptions,
    selectedLoanGoal,
    error,
  } = form;

  const showLoanHelper =
    mode === 'add'
      ? type === 'expense' && goalId && manualGoalOptions.some((o) => o.value === goalId)
      : type === 'expense' && !!selectedLoanGoal;

  return (
    <>
      <FormSection compact>
        <TransactionTypeSelector value={type} onChange={setType} />
      </FormSection>

      <FormFieldGroup>
        <FormTextInput
          label="Amount"
          value={amount}
          onChangeText={setAmount}
          keyboardType="decimal-pad"
          left={<TextInput.Affix text="$" />}
        />
        {type === 'transfer' ? (
          <>
            <InlineSelect
              label="From"
              value={fromAccountId}
              options={accountOptions}
              onChange={setFromAccountId}
            />
            <InlineSelect
              label="To"
              value={toAccountId}
              options={accountOptions}
              onChange={setToAccountId}
            />
          </>
        ) : (
          <>
            <InlineSelect
              label="Account"
              value={accountId}
              options={accountOptions}
              onChange={setAccountId}
            />
            <InlineSelect
              label="Category"
              value={parentCategoryId}
              options={parentCategories.map((c) => ({ value: c.id, label: c.name }))}
              onChange={setParentCategoryId}
            />
            {subcategories.length > 0 ? (
              <InlineSelect
                label="Subcategory"
                value={categoryId}
                options={subcategories.map((c) => ({ value: c.id, label: c.name }))}
                onChange={setCategoryId}
              />
            ) : null}
          </>
        )}

        <FormFieldButton
          label="Date"
          value={date.toLocaleDateString()}
          onPress={() => setShowDatePicker(true)}
          icon="calendar-outline"
        />

        {type !== 'transfer' ? (
          <FormFieldSwitch label="Paid" value={paid} onValueChange={setPaid} />
        ) : null}

        {type !== 'transfer' && autoLinkedGoal ? (
          <View style={layoutStyles.formField}>
            <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              Goal
            </Text>
            <Text variant="bodyMedium">
              Tracking: {autoLinkedGoal.name} ({formatGoalType(autoLinkedGoal.type)})
            </Text>
          </View>
        ) : null}

        {type === 'transfer' && autoLinkedGoal ? (
          <View style={layoutStyles.formField}>
            <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              Goal
            </Text>
            <Text variant="bodyMedium">Tracking: {autoLinkedGoal.name} (Savings)</Text>
          </View>
        ) : null}

        {type !== 'transfer' && !autoLinkedGoal && manualGoalOptions.length > 0 ? (
          <InlineSelect
            label="Goal"
            value={goalId}
            options={manualGoalOptions}
            onChange={setGoalId}
            allowClear
          />
        ) : null}

        {showLoanHelper ? (
          <FormHelperText>Each linked expense counts toward loan payoff.</FormHelperText>
        ) : null}

        {type === 'expense' && !goalId && !autoLinkedGoal && manualGoalOptions.length > 0 ? (
          <FormHelperText>Track toward a loan? Pick a goal above.</FormHelperText>
        ) : null}

        <FormTextInput label="Note (optional)" value={note} onChangeText={setNote} />
      </FormFieldGroup>

      <FormDatePicker
        visible={showDatePicker}
        value={date}
        onChange={form.setDate}
        onDismiss={() => setShowDatePicker(false)}
      />

      {error ? <Text style={errorStyle}>{error}</Text> : null}
    </>
  );
}
