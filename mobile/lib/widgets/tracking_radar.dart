import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../models/models.dart';

class TrackingRadar extends StatefulWidget {
  const TrackingRadar({
    super.key,
    required this.state,
    this.size = 180,
  });

  final TrackingUiState state;
  final double size;

  @override
  State<TrackingRadar> createState() => _TrackingRadarState();
}

class _TrackingRadarState extends State<TrackingRadar>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 3),
    )..repeat();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Color get _accent {
    switch (widget.state) {
      case TrackingUiState.trackingActive:
      case TrackingUiState.recent:
        return const Color(0xFF3DDC97);
      case TrackingUiState.trackingPaused:
      case TrackingUiState.permissionRequired:
        return const Color(0xFFFFB020);
      case TrackingUiState.gpsDisabled:
      case TrackingUiState.offlineStale:
        return const Color(0xFFFF6B6B);
      case TrackingUiState.dutyNotActive:
        return const Color(0xFF8FA3B5);
    }
  }

  String get _label {
    switch (widget.state) {
      case TrackingUiState.trackingActive:
      case TrackingUiState.recent:
        return 'LIVE';
      case TrackingUiState.trackingPaused:
        return 'PAUSED';
      case TrackingUiState.permissionRequired:
        return 'NEED ACCESS';
      case TrackingUiState.gpsDisabled:
        return 'GPS OFF';
      case TrackingUiState.offlineStale:
        return 'STALE';
      case TrackingUiState.dutyNotActive:
        return 'IDLE';
    }
  }

  @override
  Widget build(BuildContext context) {
    final active = widget.state == TrackingUiState.trackingActive ||
        widget.state == TrackingUiState.recent;

    return SizedBox(
      width: widget.size,
      height: widget.size,
      child: AnimatedBuilder(
        animation: _controller,
        builder: (context, _) {
          return CustomPaint(
            painter: _RadarPainter(
              progress: active ? _controller.value : 0.15,
              color: _accent,
              active: active,
            ),
            child: Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    _label,
                    style: GoogleFonts.outfit(
                      color: _accent,
                      fontWeight: FontWeight.w800,
                      fontSize: 16,
                      letterSpacing: 1.4,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'TRACKING',
                    style: GoogleFonts.ibmPlexSans(
                      color: Colors.white54,
                      fontSize: 11,
                      letterSpacing: 1.6,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}

class _RadarPainter extends CustomPainter {
  _RadarPainter({
    required this.progress,
    required this.color,
    required this.active,
  });

  final double progress;
  final Color color;
  final bool active;

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = size.width / 2;

    final ringPaint = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.2
      ..color = Colors.white.withValues(alpha: 0.12);

    for (var i = 1; i <= 3; i++) {
      canvas.drawCircle(center, radius * (i / 3.2), ringPaint);
    }

    final cross = Paint()
      ..color = Colors.white.withValues(alpha: 0.08)
      ..strokeWidth = 1;
    canvas.drawLine(
      Offset(center.dx - radius, center.dy),
      Offset(center.dx + radius, center.dy),
      cross,
    );
    canvas.drawLine(
      Offset(center.dx, center.dy - radius),
      Offset(center.dx, center.dy + radius),
      cross,
    );

    if (active) {
      final sweep = Paint()
        ..shader = SweepGradient(
          startAngle: 0,
          endAngle: math.pi * 2,
          transform: GradientRotation(progress * math.pi * 2),
          colors: [
            color.withValues(alpha: 0.0),
            color.withValues(alpha: 0.35),
            color.withValues(alpha: 0.0),
          ],
          stops: const [0.0, 0.18, 0.4],
        ).createShader(Rect.fromCircle(center: center, radius: radius));
      canvas.drawCircle(center, radius * 0.92, sweep);

      final blipAngle = progress * math.pi * 2;
      final blip = Offset(
        center.dx + math.cos(blipAngle) * radius * 0.62,
        center.dy + math.sin(blipAngle) * radius * 0.62,
      );
      canvas.drawCircle(blip, 4, Paint()..color = color);
      canvas.drawCircle(
        blip,
        10,
        Paint()..color = color.withValues(alpha: 0.25),
      );
    }

    canvas.drawCircle(
      center,
      8,
      Paint()..color = color.withValues(alpha: 0.9),
    );
    canvas.drawCircle(
      center,
      radius * 0.95,
      Paint()
        ..style = PaintingStyle.stroke
        ..strokeWidth = 2
        ..color = color.withValues(alpha: 0.35),
    );
  }

  @override
  bool shouldRepaint(covariant _RadarPainter oldDelegate) {
    return oldDelegate.progress != progress ||
        oldDelegate.color != color ||
        oldDelegate.active != active;
  }
}
