import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../app/theme/app_colors.dart';
import '../../../app/theme/app_typography.dart';
import '../../../core/haptics.dart';
import '../../../data/services/push_service.dart';
import '../../../data/services/supabase_service.dart';
import '../../profile/application/profile_providers.dart';
import '../../bank/presentation/bank_screen.dart';
import '../../chat/presentation/crew_screen.dart';
import '../../feed/presentation/feed_screen.dart';
import '../../profile/presentation/profile_screen.dart';
import '../../profile/presentation/search_screen.dart';
import '../../swipe/presentation/swipe_deck_screen.dart';

/// Bottom-nav shell. The feed-of-helpers puts the community **Feed** at home;
/// the complementarity swipe deck is demoted to **Discover**; Crew is your
/// matches/chats; You is your profile.
class HomeShell extends ConsumerStatefulWidget {
  const HomeShell({super.key});

  @override
  ConsumerState<HomeShell> createState() => _HomeShellState();
}

class _HomeShellState extends ConsumerState<HomeShell> {
  int _index = 0;

  // index 0 (feed) shows the wordmark; the rest show their title.
  static const _titles = ['mesh', 'discover', 'crew', 'bank', 'you'];

  @override
  void initState() {
    super.initState();
    // We're signed in by the time the shell mounts → register for push.
    PushService.register();
  }

  static const _milestones = {3, 7, 14, 30, 100};

  @override
  Widget build(BuildContext context) {
    final streak = ref.watch(streakProvider).asData?.value;

    // Celebrate the day the streak grows — louder on milestones.
    ref.listen(streakProvider, (prev, next) {
      final v = next.asData?.value;
      if (v == null || !v.extended || v.streak < 2) return;
      final milestone = _milestones.contains(v.streak);
      if (milestone) {
        Haptics.moment();
      } else {
        Haptics.commit();
      }
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          behavior: SnackBarBehavior.floating,
          backgroundColor: AppColors.ink,
          duration: const Duration(seconds: 3),
          content: Text(
            v.streak == 3
                ? 'DAY 3 STREAK — GRAPHITE CHAT BACKGROUND UNLOCKED'
                : 'DAY ${v.streak} STREAK',
            style: AppTypography.mono(
              color: AppColors.onInk,
              letterSpacing: 1.2,
            ),
          ),
        ),
      );
    });

    return Scaffold(
      appBar: AppBar(
        // 120ms fade-through on the title only — the tab switch itself stays
        // instant (it happens dozens of times a day; latency would be felt).
        title: AnimatedSwitcher(
          duration: const Duration(milliseconds: 120),
          switchInCurve: Curves.easeOutCubic,
          switchOutCurve: Curves.easeIn,
          child: Text(
            _index == 0 ? 'mesh' : _titles[_index],
            key: ValueKey(_index),
            style: _index == 0
                ? AppTypography.display(fontSize: 26, letterSpacing: -1.2)
                : Theme.of(context).textTheme.titleLarge,
          ),
        ),
        actions: [
          if (streak != null && streak.streak > 0)
            _StreakChip(days: streak.streak),
          if (_index == 0 || _index == 1)
            IconButton(
              onPressed: () => Navigator.of(context).push(MaterialPageRoute(
                builder: (_) => const SearchScreen(),
              )),
              icon: const Icon(Icons.search_rounded),
              tooltip: 'Search builders',
            ),
          if (_index == 4)
            IconButton(
              onPressed: () async {
                await PushService.unregister();
                await SupabaseService.auth.signOut();
              },
              icon: const Icon(Icons.logout_rounded),
              tooltip: 'Sign out',
            ),
        ],
      ),
      body: IndexedStack(
        index: _index,
        children: const [
          FeedScreen(),
          SwipeDeckScreen(),
          CrewScreen(),
          BankScreen(),
          ProfileScreen(),
        ],
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _index,
        onDestinationSelected: (i) {
          if (i != _index) Haptics.tap();
          setState(() => _index = i);
        },
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.dynamic_feed_outlined),
            selectedIcon: Icon(Icons.dynamic_feed),
            label: 'Feed',
          ),
          NavigationDestination(
            icon: Icon(Icons.style_outlined),
            selectedIcon: Icon(Icons.style),
            label: 'Discover',
          ),
          NavigationDestination(
            icon: Icon(Icons.diversity_3_outlined),
            selectedIcon: Icon(Icons.diversity_3),
            label: 'Crew',
          ),
          NavigationDestination(
            icon: Icon(Icons.account_balance_wallet_outlined),
            selectedIcon: Icon(Icons.account_balance_wallet),
            label: 'Bank',
          ),
          NavigationDestination(
            icon: Icon(Icons.person_outline),
            selectedIcon: Icon(Icons.person),
            label: 'You',
          ),
        ],
      ),
    );
  }
}

/// The daily-streak pill: ink flame + Space Mono count. Quietly persistent —
/// the habit loop lives in the corner of every screen.
class _StreakChip extends StatelessWidget {
  const _StreakChip({required this.days});

  final int days;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Container(
        margin: const EdgeInsets.only(right: 4),
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(100),
          border: Border.all(color: AppColors.border),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(
              Icons.local_fire_department_rounded,
              size: 15,
              color: AppColors.ink,
            ),
            const SizedBox(width: 4),
            Text(
              '$days',
              style: AppTypography.mono(
                fontSize: 12,
                color: AppColors.ink,
                fontWeight: FontWeight.w700,
                letterSpacing: 0,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
