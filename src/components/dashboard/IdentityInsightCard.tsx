import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Theme } from '../../theme';
import { GlassCard } from '../ui/GlassCard';
import { useIdentityStore } from '../../store/identityStore';
import { BlurView } from 'expo-blur';

export const IdentityInsightCard = React.memo(() => {
  const intelligence = useIdentityStore((state) => state.intelligence);

  if (!intelligence) return null;

  const getRiskColor = () => {
    switch (intelligence.riskLevel) {
      case 'High': return '#EF4444';
      case 'Moderate': return '#F59E0B';
      case 'Low': return '#10B981';
      default: return Theme.colors.primary;
    }
  };

  return (
    <GlassCard 
      intensity={30} 
      variant="liquid"
      style={[styles.container, { borderColor: `${getRiskColor()}33`, borderWidth: 1 }]}
    >
      <View style={styles.header}>
        <Text style={styles.headerText}>IDENTITY INSIGHT</Text>
        <View style={[styles.riskBadge, { backgroundColor: `${getRiskColor()}20`, borderColor: `${getRiskColor()}40` }]}>
          <Text style={[styles.riskText, { color: getRiskColor() }]}>{intelligence.riskLevel} Risk</Text>
        </View>
      </View>

      <View style={styles.scoreRow}>
        <View>
          <Text style={styles.scoreLabel}>Identity Score</Text>
          <Text style={styles.scoreValue}>{intelligence.identityScore}</Text>
        </View>
        <View style={styles.tagsContainer}>
          {intelligence.tags.map((tag, index) => (
            <View key={index} style={styles.tag}>
              <BlurView intensity={10} tint="light" style={StyleSheet.absoluteFill} />
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
      </View>

      <Text style={styles.summaryText}>{intelligence.summary}</Text>
    </GlassCard>
  );
});

IdentityInsightCard.displayName = 'IdentityInsightCard';

const styles = StyleSheet.create({
  container: {
    marginTop: Theme.spacing.lg,
    padding: Theme.spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerText: {
    color: Theme.colors.text.low,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2.5,
    opacity: 0.7
  },
  riskBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  riskText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 20,
  },
  scoreLabel: {
    color: Theme.colors.text.medium,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  scoreValue: {
    color: '#fff',
    fontSize: 48,
    fontWeight: '200',
    letterSpacing: -2,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'flex-end',
    flex: 1,
    paddingLeft: 20,
    marginBottom: 8,
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  tagText: {
    color: Theme.colors.text.medium,
    fontSize: 10,
    fontWeight: '700',
  },
  summaryText: {
    color: Theme.colors.text.medium,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
    opacity: 0.9,
  }
});
