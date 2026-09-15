import { animate, motion, useMotionValue, useTransform } from 'motion/react';
import { useState, useEffect, useMemo, useRef } from 'react';
import './Stack.css';

/**
 * Momentum projection: where a flick would come to rest if it decelerated naturally.
 * This is the exponential-decay form used for scroll deceleration, not the
 * v^2/(2a) textbook formula, which lands far too short to feel like a throw.
 */
const DECELERATION = 0.998;
const project = velocity => (velocity / 1000) * DECELERATION / (1 - DECELERATION);

function CardRotate({ children, onSendToBack, sensitivity, disableDrag = false, buried = false }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useTransform(y, [-100, 100], [60, -60]);
  const rotateY = useTransform(x, [-100, 100], [-60, 60]);

  function handleDragEnd(_, info) {
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    // LOCAL PATCH (not upstream): decide on where the flick is *heading*, not where the
    // finger happened to stop. Judging by raw offset alone meant a fast, short flick -
    // the most natural way to dismiss a card - did nothing at all.
    const projectedX = info.offset.x + project(info.velocity.x);
    const projectedY = info.offset.y + project(info.velocity.y);
    const dismissed = Math.hypot(projectedX, projectedY) > sensitivity;

    if (dismissed) onSendToBack();

    if (reduced) { x.set(0); y.set(0); return; }

    // LOCAL PATCH: the card used to snap home with x.set(0) - an instant teleport with
    // no animation at all - and on dismissal its offset was never reset, so a card you
    // dragged away stayed displaced and came back crooked. Both paths now spring back,
    // seeded with the release velocity so the animation continues from the speed the
    // finger had rather than restarting from zero.
    // X and Y are separate springs on purpose: one spring over 2D distance desynchronises
    // when the two axes carry different velocities.
    const spring = { type: 'spring', bounce: dismissed ? 0 : 0.2, duration: dismissed ? 0.35 : 0.4 };
    animate(x, 0, { ...spring, velocity: info.velocity.x });
    animate(y, 0, { ...spring, velocity: info.velocity.y });
  }

  if (disableDrag) {
    return (
      <motion.div className="card-rotate-disabled" style={{ x: 0, y: 0 }} inert={buried ? '' : undefined} aria-hidden={buried || undefined}>
        {children}
      </motion.div>
    );
  }

  return (
    <motion.div
      className="card-rotate"
      inert={buried ? '' : undefined}
      aria-hidden={buried || undefined}
      style={{ x, y, rotateX, rotateY }}
      drag
      dragConstraints={{ top: 0, right: 0, bottom: 0, left: 0 }}
      dragElastic={0.6}
      whileTap={{ cursor: 'grabbing' }}
      onDragEnd={handleDragEnd}
    >
      {children}
    </motion.div>
  );
}

export default function Stack({
  randomRotation = false,
  sensitivity = 200,
  cards = [],
  animationConfig = { stiffness: 260, damping: 20 },
  sendToBackOnClick = false,
  autoplay = false,
  autoplayDelay = 3000,
  pauseOnHover = false,
  mobileClickOnly = false,
  mobileBreakpoint = 768,
  onTopCardChange,
  cardsKey
}) {
  const [isMobile, setIsMobile] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < mobileBreakpoint);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [mobileBreakpoint]);

  const shouldDisableDrag = mobileClickOnly && isMobile;
  const shouldEnableClick = sendToBackOnClick || shouldDisableDrag;

  const [stack, setStack] = useState(() => {
    if (cards.length) {
      return cards.map((content, index) => ({ id: index + 1, content }));
    } else {
      return [
        {
          id: 1,
          content: (
            <img
              src="https://images.unsplash.com/photo-1480074568708-e7b720bb3f09?q=80&w=500&auto=format"
              alt="card-1"
              className="card-image"
            />
          )
        },
        {
          id: 2,
          content: (
            <img
              src="https://images.unsplash.com/photo-1449844908441-8829872d2607?q=80&w=500&auto=format"
              alt="card-2"
              className="card-image"
            />
          )
        },
        {
          id: 3,
          content: (
            <img
              src="https://images.unsplash.com/photo-1452626212852-811d58933cae?q=80&w=500&auto=format"
              alt="card-3"
              className="card-image"
            />
          )
        },
        {
          id: 4,
          content: (
            <img
              src="https://images.unsplash.com/photo-1572120360610-d971b9d7767c?q=80&w=500&auto=format"
              alt="card-4"
              className="card-image"
            />
          )
        }
      ];
    }
  });

  // LOCAL PATCH (not upstream): this effect keyed on the `cards` array identity, so any
  // parent re-render that produced a fresh array reset the stack order. In practice that
  // silently undid the reorder the user had just performed - the deck appeared to ignore
  // clicks. When `cardsKey` is supplied, the reset follows the identity of the *content*
  // instead, and re-renders that only change callbacks or transient flags leave the order
  // alone. Without it the original array-identity behaviour is kept.
  const cardsRef = useRef(cards);
  cardsRef.current = cards;
  const resetSignal = cardsKey === undefined ? cards : cardsKey;

  useEffect(() => {
    const current = cardsRef.current;
    if (current.length) {
      setStack(current.map((content, index) => ({ id: index + 1, content })));
    }
  }, [resetSignal]);

  // Content still has to refresh in place on every render (button labels, disabled
  // states), without disturbing the order the user has arranged.
  useEffect(() => {
    setStack(prev => {
      if (!cards.length || prev.length !== cards.length) return prev;
      return prev.map(card => ({ ...card, content: cards[card.id - 1] }));
    });
  }, [cards]);

  // LOCAL PATCH (not upstream): report the card currently on top. Without this the
  // stack order is private state, so a detail panel next to the deck cannot follow it.
  const topId = stack.length ? stack[stack.length - 1].id : null;
  const reportedTop = useRef(null);
  useEffect(() => {
    if (topId !== reportedTop.current) {
      reportedTop.current = topId;
      onTopCardChange?.(topId);
    }
  }, [topId, onTopCardChange]);

  // LOCAL PATCH: rotations were produced with Math.random() during render, so every
  // re-render reshuffled every card's tilt and the whole deck visibly twitched. They
  // are now drawn once per card id and kept.
  const rotations = useMemo(() => {
    const map = new Map();
    stack.forEach(card => map.set(card.id, randomRotation ? Math.random() * 10 - 5 : 0));
    return map;
  }, [stack.length, randomRotation]);

  const sendToBack = id => {
    setStack(prev => {
      const newStack = [...prev];
      const index = newStack.findIndex(card => card.id === id);
      const [card] = newStack.splice(index, 1);
      newStack.unshift(card);
      return newStack;
    });
  };

  useEffect(() => {
    if (autoplay && stack.length > 1 && !isPaused) {
      const interval = setInterval(() => {
        const topCardId = stack[stack.length - 1].id;
        sendToBack(topCardId);
      }, autoplayDelay);

      return () => clearInterval(interval);
    }
  }, [autoplay, autoplayDelay, stack, isPaused]);

  return (
    <div
      className="stack-container"
      onMouseEnter={() => pauseOnHover && setIsPaused(true)}
      onMouseLeave={() => pauseOnHover && setIsPaused(false)}
    >
      {stack.map((card, index) => {
        const randomRotate = rotations.get(card.id) ?? 0;
        return (
          <CardRotate
            key={card.id}
            onSendToBack={() => sendToBack(card.id)}
            sensitivity={sensitivity}
            disableDrag={shouldDisableDrag}
            // LOCAL PATCH (not upstream): only the top card is interactive. Every card in
            // the pile rendered its own controls into the tab order, so keyboard users
            // tabbed through buttons belonging to people they could not see - and could
            // fire an action on the wrong person entirely.
            buried={index !== stack.length - 1}
          >
            <motion.div
              className="card"
              onClick={event => {
                // LOCAL PATCH: the click handler covered the whole card, so pressing a
                // button inside one also sent that card to the back and the action
                // appeared to "just swap". Clicks that start on a control are ignored.
                if (!shouldEnableClick) return;
                if (event.target.closest('button, a, input, select, textarea, label')) return;
                sendToBack(card.id);
              }}
              animate={{
                rotateZ: (stack.length - index - 1) * 4 + randomRotate,
                scale: 1 + index * 0.06 - stack.length * 0.06,
                transformOrigin: '90% 90%'
              }}
              initial={false}
              transition={{
                type: 'spring',
                stiffness: animationConfig.stiffness,
                damping: animationConfig.damping
              }}
            >
              {card.content}
            </motion.div>
          </CardRotate>
        );
      })}
    </div>
  );
}
