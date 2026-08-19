import 'dart:async';

import 'package:flutter/services.dart';

/// Semantic haptics — one vocabulary for the whole app so intensity maps to
/// meaning, not to whichever call a screen happened to pick.
///
/// tap    → selection ticks (chips, tabs, toggles, minor buttons)
/// commit → an action landed (swipe decision, send, post, upvote)
/// moment → the rare big beat (match, unlock, streak milestone)
abstract final class Haptics {
  static void tap() => HapticFeedback.selectionClick();

  static void commit() => HapticFeedback.mediumImpact();

  static void moment() => HapticFeedback.heavyImpact();

  /// Double-pulse for the match reveal: impact, then an echo as the
  /// celebration settles. Fire-and-forget.
  static Future<void> celebration() async {
    unawaited(HapticFeedback.heavyImpact());
    await Future<void>.delayed(const Duration(milliseconds: 140));
    unawaited(HapticFeedback.lightImpact());
  }
}
