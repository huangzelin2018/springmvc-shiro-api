package com.hq.utils;

import java.util.HashSet;
import java.util.Set;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * 利用twitter的snowflake算法实现ID分配
 * 其原理结构如下，我分别用一个0表示一位，用—分割开部分的作用：
 * 0---0000000000 0000000000 0000000000 0000000000 0 --- 00000 ---00000 ---000000000000
 * 第一位为未使用（实际上也可作为long的符号位），接下来的41位为毫秒级时间，然后5位datacenter标识位，5位机器ID（并不算标识符，实际是为线程标识），然后12位该毫秒内的当前毫秒内的计数，加起来刚好64位，为一个Long型。
 * 这样的好处是，整体上按照时间自增排序，并且整个分布式系统内不会产生ID碰撞（由datacenter和机器ID作区分），并且效率较高，经测试，snowflake每秒能够产生26万ID左右，完全满足需要。
 * 参考http://www.cppblog.com/tx7do/archive/2014/06/10/207248.html
 * <p/>
 * 针对项目改进如下：
 * 0 ---0000000000 0000000000 0000000000 0000000000 0 ---00 ---000 ---00000 ---000000000000
 * 第一位为未使用（实际上也可作为long的符号位），接下来的41位为毫秒级时间(约69年)，然后2位数据中心标识位（4个），4位机器ID（16台），
 * 4位线程ID（最大16），然后12位该毫秒内的当前毫秒内的计数（4096个），加起来刚好64位，为一个Long型。
 * @author linyuebin
 * @date 2017年6月28日上午10:14:53
 */
public final class GenIDUtil {
	
	private static Logger log = LoggerFactory.getLogger(GenIDUtil.class);
	
    private static final short dataCenterMask = -1 ^ -1 << 2;
    private static final short machineMask = -1 ^ -1 << 4;
    private static final long threadMask = -1L ^ -1L << 4;
    private static final long sequenceMask = -1L ^ -1L << 12;
    private static final long refTimestamp = 1451577600000L;        // 基准时间戳 2016-01-01 00:00:00:000
    private static final short timestampLeftShift = 22;
    private static final short dataCenterLeftShift = 20;
    private static final short machineLeftShift = 16;
    private static final short threadLeftShift = 12;

    private long lastTimestamp = -1L;
    private long sequence = 0L;                         // 12位表示

    private short dataCenterId = 0;
    private short machineId = 0;

    public GenIDUtil() {
        this.dataCenterId = 0;
        this.machineId = 0;
    }

    public GenIDUtil(short dataCenterId, short machineId) {
        this.dataCenterId = (dataCenterId >= 0 && dataCenterId < 4) ? dataCenterId : 0;
        this.machineId = (machineId >= 0 && machineId < 16) ? machineId : 0;
    }

    private static void genSingleID() {
        long id = new GenIDUtil((short) 0, (short) 0).nextId();
        log.info("genSingleID result : {} ", id);
    }

    private static void genBatchId() {
        class Test implements Runnable {
            @Override
            public void run() {
                Set<Long> ids = new HashSet();
                GenIDUtil idUtil = new GenIDUtil((short) 0, (short) 0);
                long begin = System.currentTimeMillis();
                for (int i = 0; i < 1000000; ++i) {
                    long id = idUtil.nextId();
                    if (ids.contains(id)) {
                        throw new RuntimeException("xxxxx");
                    } else {
                        ids.add(id);
                    }
                }
                ids = null;
                long end = System.currentTimeMillis();
                log.info("finish : " + (end - begin));
            }
        }


        for (int i = 0; i < 100; i++) {
            Thread thread = new Thread(new Test());
            thread.start();
        }
    }

    public synchronized long nextId() {
        long timestamp = this.timeGen();

        if (this.lastTimestamp == timestamp) {
            this.sequence = (this.sequence + 1) & this.sequenceMask;
            if (this.sequence == 0) {
                timestamp = this.tilNextMillis(this.lastTimestamp);
            }
        } else {
            this.sequence = 0;
        }

        if (timestamp < this.lastTimestamp) {
            try {
                throw new Exception(String.format("Clock moved backwards.  Refusing to generate id for %d milliseconds",
                        this.lastTimestamp - timestamp));
            } catch (Exception e) {
                log.error("GenIDUtil nextId meet exception.", e);
            }
        }

        this.lastTimestamp = timestamp;

        long curThreadId = Thread.currentThread().getId();
        long nextId = ((timestamp - refTimestamp << timestampLeftShift))
                | ((this.dataCenterId & dataCenterMask) << this.dataCenterLeftShift)
                | ((this.machineId & machineMask) << this.machineLeftShift)
                | ((curThreadId & threadMask) << this.threadLeftShift)
                | (this.sequence);

        return nextId;
    }

    private long tilNextMillis(final long lastTimestamp) {
        long timestamp = this.timeGen();
        while (timestamp <= lastTimestamp) {
            timestamp = this.timeGen();
        }
        return timestamp;
    }

    private long timeGen() {
        return System.currentTimeMillis();
    }
    
    public static void main(String[] args) {
 		long id = new GenIDUtil().nextId();
 		System.out.println(id);
	}
    
}
